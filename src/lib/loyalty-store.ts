import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export type PublicLoyaltyUser = {
  id: string;
  name: string;
  email: string;
  stamps: number;
  rewards: number;
  totalOrders: number;
  role: "customer" | "admin";
};

type StoredUser = PublicLoyaltyUser & {
  passwordHash: string;
  passwordSalt: string;
};

type StoredSession = {
  tokenHash: string;
  userId: string;
  expiresAt: string;
};

type StoreData = {
  users: StoredUser[];
  sessions: StoredSession[];
};

const emptyStore = (): StoreData => ({ users: [], sessions: [] });

export class LoyaltyError extends Error {
  constructor(
    public readonly code: "EMAIL_EXISTS" | "INVALID_CREDENTIALS" | "INVALID_SESSION",
    message: string,
  ) {
    super(message);
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function publicUser(user: StoredUser): PublicLoyaltyUser {
  const { passwordHash: _passwordHash, passwordSalt: _passwordSalt, ...safeUser } = user;
  void _passwordHash;
  void _passwordSalt;
  return { ...safeUser, role: user.role ?? "customer" };
}

function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  return {
    session: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    token,
  };
}

export class LoyaltyStore {
  constructor(private readonly filePath: string) {}

  private async read(): Promise<StoreData> {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8")) as StoreData;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyStore();
      throw error;
    }
  }

  private async write(data: StoreData) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporaryFile = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(temporaryFile, JSON.stringify(data, null, 2), { mode: 0o600 });
    await rename(temporaryFile, this.filePath);
  }

  async createAccount(input: { name: string; email: string; password: string }) {
    const data = await this.read();
    const email = input.email.trim().toLowerCase();
    if (data.users.some((user) => user.email === email)) {
      throw new LoyaltyError("EMAIL_EXISTS", "Un compte existe déjà avec cet e-mail.");
    }
    const salt = randomBytes(16).toString("hex");
    const passwordHash = Buffer.from(
      await scrypt(input.password, salt, 64) as ArrayBuffer,
    ).toString("hex");
    const user: StoredUser = {
      id: randomBytes(16).toString("hex"),
      name: input.name.trim(),
      email,
      passwordHash,
      passwordSalt: salt,
      stamps: 0,
      rewards: 0,
      totalOrders: 0,
      role: "customer",
    };
    const { session, token } = createSession(user.id);
    data.users.push(user);
    data.sessions.push(session);
    await this.write(data);
    return { user: publicUser(user), token };
  }

  async getUserByToken(token: string) {
    const data = await this.read();
    const session = data.sessions.find(
      (candidate) =>
        candidate.tokenHash === hashToken(token) &&
        new Date(candidate.expiresAt).getTime() > Date.now(),
    );
    if (!session) return null;
    const user = data.users.find((candidate) => candidate.id === session.userId);
    return user ? publicUser(user) : null;
  }

  async addOrder(token: string, pizzaCount: number) {
    const data = await this.read();
    const session = data.sessions.find(
      (candidate) =>
        candidate.tokenHash === hashToken(token) &&
        new Date(candidate.expiresAt).getTime() > Date.now(),
    );
    const user = session
      ? data.users.find((candidate) => candidate.id === session.userId)
      : undefined;
    if (!user) {
      throw new LoyaltyError("INVALID_SESSION", "La session a expiré.");
    }
    const earned = Math.max(1, Math.floor(pizzaCount));
    const stampTotal = user.stamps + earned;
    user.rewards += Math.floor(stampTotal / 6);
    user.stamps = stampTotal % 6;
    user.totalOrders += 1;
    await this.write(data);
    return publicUser(user);
  }

  async logout(token: string) {
    const data = await this.read();
    const tokenHash = hashToken(token);
    data.sessions = data.sessions.filter((session) => session.tokenHash !== tokenHash);
    await this.write(data);
  }

  async setRoleByEmail(email: string, role: "customer" | "admin") {
    const data = await this.read();
    const user = data.users.find(
      (candidate) => candidate.email === email.trim().toLowerCase(),
    );
    if (!user) return false;
    user.role = role;
    await this.write(data);
    return true;
  }

  async login(input: { email: string; password: string }) {
    const data = await this.read();
    const user = data.users.find(
      (candidate) => candidate.email === input.email.trim().toLowerCase(),
    );
    if (!user) {
      throw new LoyaltyError("INVALID_CREDENTIALS", "E-mail ou mot de passe incorrect.");
    }
    const candidateHash = Buffer.from(
      await scrypt(input.password, user.passwordSalt, 64) as ArrayBuffer,
    );
    const storedHash = Buffer.from(user.passwordHash, "hex");
    if (candidateHash.length !== storedHash.length || !timingSafeEqual(candidateHash, storedHash)) {
      throw new LoyaltyError("INVALID_CREDENTIALS", "E-mail ou mot de passe incorrect.");
    }
    const { session, token } = createSession(user.id);
    data.sessions.push(session);
    await this.write(data);
    return { user: publicUser(user), token };
  }
}
