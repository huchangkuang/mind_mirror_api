import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/modules/auth/auth.service';
import { hashPassword } from '../src/modules/auth/password.util';

describe('AuthService transaction rollback behavior', () => {
  it('should stop after first failing write in transaction', async () => {
    const mockTx = {
      user: {
        update: jest.fn().mockRejectedValue(new Error('update failed')),
      },
      refreshToken: {
        updateMany: jest.fn(),
      },
    };

    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          username: 'u',
          passwordHash: hashPassword('current-pass'),
        }),
      },
      $transaction: jest.fn(async (cb: (tx: typeof mockTx) => Promise<void>) =>
        cb(mockTx),
      ),
    } as never;

    const jwtService = {
      signAsync: jest.fn(),
      verify: jest.fn(),
    } as unknown as JwtService;

    const service = new AuthService(prisma, jwtService);

    await expect(
      service.changePassword(1, 'current-pass', 'new-pass-123'),
    ).rejects.toThrow('update failed');

    expect(mockTx.user.update).toHaveBeenCalledTimes(1);
    expect(mockTx.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});
