import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type CampusChoice = "burrata" | "nduja";
export type CampusState = {
  battle: { counts: Record<CampusChoice, number>; choice: CampusChoice | null; closed: boolean; winner: CampusChoice | null };
  club: { quiz: boolean; vote: boolean; rewardCode: string | null };
};

export class CampusError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 409) { super(message); }
}

export class CampusStore {
  private readonly db: DatabaseSync;
  constructor(filePath = join(process.env.FOURCHETTE_DATA_DIR || join(process.cwd(), ".data"), "campus.db")) {
    mkdirSync(dirname(filePath), { recursive: true });
    this.db = new DatabaseSync(filePath);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS participants (
        identity TEXT PRIMARY KEY,
        choice TEXT CHECK(choice IN ('burrata','nduja')),
        quiz INTEGER NOT NULL DEFAULT 0 CHECK(quiz IN (0,1)),
        reward_code TEXT UNIQUE
      );
      CREATE TABLE IF NOT EXISTS battle (
        id INTEGER PRIMARY KEY CHECK(id=1),
        winner TEXT CHECK(winner IN ('burrata','nduja'))
      );
      INSERT OR IGNORE INTO battle(id) VALUES(1);`);
  }
  dispose() { this.db.close(); }
  private transaction<T>(operation: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  vote(identity: string, choice: CampusChoice) {
    return this.transaction(() => {
      if (this.getState(identity).battle.closed) throw new CampusError("BATTLE_CLOSED", "Le vote est clos.");
      this.db.prepare(`INSERT INTO participants(identity,choice) VALUES(?,?)
        ON CONFLICT(identity) DO UPDATE SET choice=excluded.choice WHERE participants.choice IS NULL`).run(identity, choice);
      return this.getState(identity);
    });
  }
  // Authorization belongs to the route: only requireAdmin may call this method.
  closeBattle(identity: string, tiedWinner?: CampusChoice) {
    return this.transaction(() => {
      const state = this.getState(identity);
      if (state.battle.closed) return state;
      const { burrata, nduja } = state.battle.counts;
      if (burrata === nduja && !tiedWinner) throw new CampusError("BATTLE_TIED", "En cas d'égalité, choisissez explicitement la pizza gagnante.");
      const winner = burrata === nduja ? tiedWinner! : burrata > nduja ? "burrata" : "nduja";
      this.db.prepare("UPDATE battle SET winner=? WHERE id=1").run(winner);
      return this.getState(identity);
    });
  }
  completeQuiz(identity: string) {
    this.db.prepare(`INSERT INTO participants(identity,quiz) VALUES(?,1)
      ON CONFLICT(identity) DO UPDATE SET quiz=1`).run(identity);
    return this.getState(identity);
  }
  claim(identity: string) {
    const state = this.getState(identity);
    if (!state.club.quiz || !state.club.vote) {
      throw new CampusError("NOT_ELIGIBLE", "Terminez le quiz et le vote pour obtenir le badge.");
    }
    // Collectible Pionnier Fourchette badge only: never a coupon or loyalty reward.
    this.db.prepare("UPDATE participants SET reward_code=? WHERE identity=? AND reward_code IS NULL")
      .run(`PIONNIER-FOURCHETTE-${randomUUID()}`, identity);
    return this.getState(identity);
  }
  getState(identity: string): CampusState {
    const counts = { burrata: 0, nduja: 0 };
    for (const row of this.db.prepare("SELECT choice, COUNT(*) AS count FROM participants WHERE choice IS NOT NULL GROUP BY choice").all()) {
      counts[row.choice as CampusChoice] = Number(row.count);
    }
    const participant = this.db.prepare("SELECT choice, quiz, reward_code FROM participants WHERE identity=?").get(identity);
    const winner = this.db.prepare("SELECT winner FROM battle WHERE id=1").get()!.winner as CampusChoice | null;
    return {
      battle: { counts, choice: (participant?.choice as CampusChoice | null) ?? null, closed: winner !== null, winner },
      club: { quiz: participant?.quiz === 1, vote: !!participant?.choice, rewardCode: (participant?.reward_code as string | null) ?? null },
    };
  }
}
