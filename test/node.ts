/**
 * @jest-environment node
 */

import { isAbortError, pSignal, AbortError } from '..'

describe('p-signal (node)', () => {
    describe('pSignal()', () => {
        it('aborted before it started', async () => {
            const controller = new AbortController()

            controller.abort()

            await expect(pSignal(controller.signal, wait())).rejects.toThrow(
                'The operation was aborted.',
            )
        })

        it('aborted after it started', async () => {
            const controller = new AbortController()

            const promise = pSignal(controller.signal, wait())

            controller.abort()

            await expect(promise).rejects.toThrow('The operation was aborted.')
        })

        it('promise successfully resolved when not aborted', async () => {
            const controller = new AbortController()

            await expect(pSignal(controller.signal, wait())).resolves.toBe(1)
        })

        it('allow undefined as "signal" value', async () => {
            await expect(pSignal(undefined, wait())).resolves.toBe(1)
        })

        // passing both undefined and AbortSignal because they are in if condition branches
        it('thrown error propagates', async () => {
            await expect(async () => {
                await pSignal(undefined, async () => {
                    throw new Error('dummy')
                })
            }).rejects.toThrowError('dummy')

            await expect(
                pSignal(new AbortController().signal, async () => {
                    throw new Error('dummy')
                }),
            ).rejects.toThrowError('dummy')
        })

        it(`doesn't synchronously throw an error`, () => {
            const throwFn = () => {
                return pSignal(undefined, () => {
                    throw new Error('dummy')
                }).catch(() => {
                    // swallow (intentionally)
                })
            }

            expect(throwFn).not.toThrow()
        })
    })

    describe('isAbortError()', () => {
        if (typeof DOMException === 'undefined') {
            it('returns true for AbortError', () => {
                const error1 = new Error('The operation was aborted.')
                const error2 = new Error('regardless of the error message')
                error1.name = 'AbortError'
                error2.name = 'AbortError'
                expect(isAbortError(error1)).toBe(true)
                expect(isAbortError(error2)).toBe(true)
            })
        } else {
            it('returns true for AbortError', () => {
                expect(isAbortError(new DOMException('', 'AbortError'))).toBe(true)
                expect(isAbortError(new DOMException('regardless of message', 'AbortError'))).toBe(
                    true,
                )
            })
        }

        it('returns true for an AbortError instance', () => {
            expect(isAbortError(new AbortError())).toBe(true)
        })

        it('returns false for other errors', () => {
            expect(isAbortError(new Error())).toBe(false)
        })
    })
})

function wait(): Promise<1> {
    return new Promise((resolve) => setTimeout(() => resolve(1), 1))
}
