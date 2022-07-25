export async function pSignal<T>(
    signal: AbortSignal | undefined,
    value: Promise<T> | (() => Promise<T>),
): Promise<T> {
    const unwrappedValue = typeof value === 'function' ? value() : value

    // support `undefined` value for `signal` because commonly methods like `fetch()` support an
    // option called `signal` which can be `undefined`. in these cases just doing
    // `pSignal(options.signal, promise)` is a great option to not make conditionals when
    // `options.signal` is undefined
    if (signal === undefined) {
        return await unwrappedValue
    }

    if (signal.aborted) {
        // throwing of error is asynchronous:
        // - 😃 consistent with `controller.abort()`
        // - 😡 not like bluebird 3
        // - 😡 it was async in bluebird 2
        // - 😡 not like `p-cancelable`

        throw createAbortError()
    }

    // i use it to distinguish between an aborted promise and a promise that was resolved when
    // calling Promise.race()
    class AbortedValue {}

    let removeAbortListener = (): void => {}
    const abortPromise = new Promise<AbortedValue>((resolve) => {
        // we use `resolve()` instead of `reject()` because for some unknown reason(this can change in
        // the future) Chrome DevTools stops when calling `reject()` but doesn't when calling
        // `resolve()` and then throwing in the function body
        const onAbort = (): void => resolve(new AbortedValue())
        signal.addEventListener('abort', onAbort)
        removeAbortListener = (): void => signal.removeEventListener('abort', onAbort)
    })

    let result: T | AbortedValue
    try {
        result = await Promise.race([abortPromise, unwrappedValue])
    } catch (err) {
        removeAbortListener()

        throw err
    }

    removeAbortListener()

    if (result instanceof AbortedValue) {
        // intentionally creating a new error because this one will have a better stack trace
        throw createAbortError()
    }

    return result
}

export function isAbortError(value: unknown): value is Error {
    return value instanceof Error && value.name === 'AbortError'
}

function createAbortError(): Error {
    if (typeof DOMException === 'undefined') {
        const error = new Error('The operation was aborted.')
        error.name = 'AbortError'
        return error
    }

    return new DOMException('The operation was aborted.', 'AbortError')
}
