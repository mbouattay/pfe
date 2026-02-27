import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type AppUser = {
  id: number;
  role: 'CLIENT' | 'EMPLOYER' | 'ADMIN';
} & Record<string, unknown>;

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AppUser | undefined }>();
    return request.user;
  },
);
