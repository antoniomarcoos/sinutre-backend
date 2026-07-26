import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { env } from '../config/env';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// GET /auth/github
// Redireciona o navegador para a tela de autorização do GitHub.
export async function redirectToGithub(_req: Request, res: Response) {
  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.callbackUrl,
    scope: 'read:user',
  });
  res.redirect(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`);
}

// GET /auth/github/callback?code=...
// 1) troca o code pelo access_token
// 2) busca dados do usuário no GitHub
// 3) cria ou atualiza o User
// 4) emite um JWT e redireciona ao frontend
export async function githubCallback(req: Request, res: Response) {
  const code = req.query.code as string | undefined;
  if (!code) {
    return res.status(400).json({ error: 'Parâmetro "code" ausente.' });
  }

  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.github.clientId,
      client_secret: env.github.clientSecret,
      code,
      redirect_uri: env.github.callbackUrl,
    }),
  });

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!tokenData.access_token) {
    return res
      .status(401)
      .json({ error: 'Falha ao obter access_token do GitHub.' });
  }

  const userResponse = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'sinutre-back',
    },
  });

  const githubUser = (await userResponse.json()) as {
    id: number;
    login: string;
    name: string | null;
    avatar_url: string | null;
  };

  const user = await prisma.user.upsert({
    where: { githubId: String(githubUser.id) },
    update: {
      githubLogin: githubUser.login,
      name: githubUser.name ?? githubUser.login,
      avatarUrl: githubUser.avatar_url ?? undefined,
    },
    create: {
      githubId: String(githubUser.id),
      githubLogin: githubUser.login,
      name: githubUser.name ?? githubUser.login,
      avatarUrl: githubUser.avatar_url ?? undefined,
    },
  });

  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' });

  res.redirect(`${env.frontendUrl}/?token=${token}`);
}

// GET /auth/google
// Redireciona o navegador para a tela de autorização do Google.
export async function redirectToGoogle(_req: Request, res: Response) {
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: env.google.callbackUrl,
    response_type: 'code',
    scope: 'email profile',
  });
  res.redirect(`${GOOGLE_AUTHORIZE_URL}?${params.toString()}`);
}

// GET /auth/google/callback?code=...
// 1) troca o code pelo access_token
// 2) busca dados do usuário no Google
// 3) cria ou atualiza o User
// 4) emite um JWT e redireciona ao frontend
export async function googleCallback(req: Request, res: Response) {
  const code = req.query.code as string | undefined;
  if (!code) {
    return res.status(400).json({ error: 'Parâmetro "code" ausente.' });
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      code,
      redirect_uri: env.google.callbackUrl,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!tokenData.access_token) {
    return res
      .status(401)
      .json({ error: 'Falha ao obter access_token do Google.' });
  }

  const userResponse = await fetch(GOOGLE_USER_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/json',
    },
  });

  const googleUser = (await userResponse.json()) as {
    id: string;
    email: string;
    name: string;
    picture: string;
  };

  const user = await prisma.user.upsert({
    where: { googleId: googleUser.id },
    update: {
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    },
    create: {
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    },
  });

  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' });

  res.redirect(`${env.frontendUrl}/?token=${token}`);
}