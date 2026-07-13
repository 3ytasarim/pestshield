import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** JWT auth guard'ını bypass eder (login/register/refresh gibi uçlar için) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
