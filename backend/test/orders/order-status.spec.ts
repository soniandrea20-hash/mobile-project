import { ConflictException } from '@nestjs/common';
import { allowedTransitions, assertTransition } from 'src/orders/domain/order-status';

describe('Order status transitions', () => {
  it('debe permitir solo el siguiente estado o cancelar', () => {
    expect(allowedTransitions('generada')).toEqual(['en_preparacion', 'cancelada']);
    expect(allowedTransitions('en_preparacion')).toEqual(['lista', 'cancelada']);
    expect(allowedTransitions('lista')).toEqual(['entregada', 'cancelada']);
  });

  it('debe tratar entregada y cancelada como finales', () => {
    expect(allowedTransitions('entregada')).toEqual([]);
    expect(allowedTransitions('cancelada')).toEqual([]);
  });

  it('debe aceptar una transicion valida', () => {
    expect(() => assertTransition('generada', 'en_preparacion')).not.toThrow();
  });

  it.each([
    ['entregada', 'generada'],
    ['generada', 'lista'],
    ['lista', 'en_preparacion'],
    ['lista', 'lista'],
    ['cancelada', 'generada'],
  ] as const)('debe rechazar %s -> %s con INVALID_STATUS_TRANSITION', (from, to) => {
    const error: any = (() => { try { assertTransition(from, to); } catch (e) { return e; } })();

    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toMatchObject({
      code: 'INVALID_STATUS_TRANSITION',
      details: { from, to, allowed: allowedTransitions(from) },
    });
  });
});
