/* eslint-env jest */

import { isAbortError, pSignal, pSignalSettle } from '.'

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

    describe('pSignalSettle()', () => {
        it('settled', async () => {
            const controller = new AbortController()
            const result = await pSignalSettle(controller.signal, wait())

            expect(result).toStrictEqual({ status: 'fulfilled', value: undefined })
        })

        it('rejected', async () => {
            const controller = new AbortController()
            const result = await pSignalSettle(
                controller.signal,
                Promise.reject(new Error('error')),
            )

            expect(result).toStrictEqual({ status: 'rejected', reason: new Error('error') })
        })

        it('aborted', async () => {
            const controller = new AbortController()
            const promise = pSignalSettle(controller.signal, wait())

            controller.abort()

            const result = await promise

            expect(result).toStrictEqual({
                status: 'rejected',
                reason: new DOMException('The operation was aborted.', 'AbortError'),
            })
        })
    })
})

function wait(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1))
}
