export async function pSignal<T>(signal: AbortSignal | undefined, promise: Promise<T>): Promise<T> {
    // support `undefined` value for `signal` because commonly methods like `fetch()` support an
    // option called `signal` which can be `undefined`. in these cases just doing
    // `pSignal(options.signal, promise)` is a great option to not make conditionals when
    // `options.signal` is undefined
    if (signal === undefined) {
        return await promise
    }

    if (signal.aborted) {
        // throwing of error is asynchronous:
        // - 😃 consistent with `controller.abort()`
        // - 😡 not like bluebird 3
        // - 😡 it was async in bluebird 2
        // - 😡 not like `p-cancelable`
        await Promise.resolve()

        throw createAbortError()
    }

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
        result = await Promise.race([abortPromise, promise])
    } catch (err) {
        removeAbortListener()

        throw err
    }

    removeAbortListener()

    if (result instanceof AbortedValue) {
        // intentionally creating a new error because this one will have a better stacktrace
        throw createAbortError()
    }

    return result
}

export async function pSignalSettle<T>(
    signal: AbortSignal | undefined,
    promise: Promise<T>,
): Promise<{ status: 'rejected'; reason: unknown } | { status: 'fulfilled'; value: T }> {
    try {
        return { status: 'fulfilled', value: await pSignal(signal, promise) }
    } catch (err) {
        return { status: 'rejected', reason: err }
    }
}

export function isAbortError(value: unknown): value is DOMException {
    return value instanceof DOMException && value.name === 'AbortError'
}

function createAbortError(): DOMException {
    return new DOMException('The operation was aborted.', 'AbortError')
}

class AbortedValue {}
