import crypto from "node:crypto";

interface Session {
  accessToken: string;
  createdAt: number;
}

const sessions = new Map<string, Session>();

const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

export function createSession(
  accessToken: string,
): string {
  const sessionId = crypto
    .randomBytes(32)
    .toString("hex");

  sessions.set(sessionId, {
    accessToken,
    createdAt: Date.now(),
  });

  return sessionId;
}

export function getSession(
  sessionId: string,
): Session | null {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  const expired =
    Date.now() - session.createdAt >
    SESSION_DURATION;

  if (expired) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

export function deleteSession(
  sessionId: string,
): void {
  sessions.delete(sessionId);
}