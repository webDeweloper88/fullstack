// src/oauth/strategies/yandex.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-oauth2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface YandexProfile {
  id: string;
  login: string;
  client_id: string;
  display_name: string;
  real_name?: string;
  first_name: string;
  last_name?: string;
  sex?: string;
  default_email: string;
  emails: string[];
  default_avatar_id?: string;
  is_avatar_empty?: boolean;
  psuid?: string;
}

@Injectable()
export class YandexStrategy extends PassportStrategy(Strategy, 'yandex') {
  constructor(config: ConfigService) {
    super({
      authorizationURL: 'https://oauth.yandex.com/authorize',
      tokenURL: 'https://oauth.yandex.com/token',
      clientID: config.getOrThrow('YANDEX_CLIENT_ID'),
      clientSecret: config.getOrThrow('YANDEX_CLIENT_SECRET'),
      callbackURL: config.getOrThrow('YANDEX_REDIRECT_URI'),
      scope: 'login:email',
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    _profile: any,
    done: VerifyCallback,
  ) {
    try {
      const { data } = await axios.get<YandexProfile>(
        'https://login.yandex.ru/info?format=json',
        { headers: { Authorization: `OAuth ${accessToken}` } },
      );

      // 1) displayName = first_name
      const displayName = data.first_name;

      // 2) pictureUrl: строим публичную ссылку на аватар
      const pictureUrl = data.default_avatar_id
        ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-200`
        : null;

      const oauthUser = {
        provider: 'yandex',
        providerId: data.id,
        email: data.default_email,
        displayName,
        pictureUrl,
        accessToken,
      };

      done(null, oauthUser);
    } catch (err) {
      done(err, false);
    }
  }
}
