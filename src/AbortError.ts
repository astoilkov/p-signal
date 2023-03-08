// https://github.com/sindresorhus/ky/blob/740732c78aad97e9aec199e9871bdbf0ae29b805/source/errors/DOMException.ts
function createAbortErrorClass(): {
    prototype: Error
    new (message?: string | undefined): Error
} {
    if (typeof DOMException === 'undefined') {
        return class AbortError extends Error {
            constructor(message?: string | undefined) {
                super(message ?? 'The operation was aborted.')
                this.name = 'AbortError'
            }
        }
    }

    return class AbortError extends DOMException {
        constructor(message?: string | undefined) {
            super(message ?? 'The operation was aborted.', 'AbortError')
        }
    }
}

const AbortError = createAbortErrorClass()

export default AbortError
