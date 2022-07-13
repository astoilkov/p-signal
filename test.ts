/* eslint-env jest */

import { isAbortError, pSignal } from '.'

describe('p-signal', () => {
    describe('pSignal()', () => {
        it('aborted before it started', async () => {
            const controller = new AbortController()

            controller.abort()

            try {
                await pSignal(controller.signal, wait())
            } catch (err) {
                expect(isAbortError(err)).toBe(true)
            }
        })

        it('aborted after it started', async () => {
            const controller = new AbortController()

            const promise = pSignal(controller.signal, wait())

            controller.abort()

            try {
                await promise
            } catch (err) {
                expect(isAbortError(err)).toBe(true)
            }
        })

        it('promise successfully resolved when not aborted', async () => {
            const controller = new AbortController()

            await expect(async () => await pSignal(controller.signal, wait())).not.toThrow()
        })

        it('allow undefined as "signal" value', async () => {
            await pSignal(undefined, wait())
        })
    })

    describe('isAbortError()', () => {
        it('returns true for AbortError', () => {
            expect(isAbortError(new DOMException('', 'AbortError'))).toBe(true)
            expect(isAbortError(new DOMException('regardless of message', 'AbortError'))).toBe(true)
        })

        it('returns false for other errors', () => {
            expect(isAbortError(new Error())).toBe(false)
        })
    })
})

function wait(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1))
}
