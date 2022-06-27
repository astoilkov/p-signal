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
    const abortPromise = new Promise<DOMException>((resolve) => {
        // we use `resolve()` instead of `reject()` because for some unknown reason(this can change in
        // the future) Chrome DevTools stops when calling `reject()` but doesn't when calling
        // `resolve()` and then throwing in the function body
        const onAbort = (): void => resolve(createAbortError())
        signal.addEventListener('abort', onAbort)
        removeAbortListener = (): void => signal.removeEventListener('abort', onAbort)
    })

    const result = await Promise.race([abortPromise, promise])

    removeAbortListener()

    if (isAbortError(result)) {
        // intentionally creating a new error because this one will have a better stacktrace
        throw createAbortError()
    }

    return result
}

export async function pSignalSettle<T>(
    signal: AbortSignal | undefined,
    promise: Promise<T>,
): Promise<{ status: 'aborted' } | { status: 'fulfilled'; value: T }> {
    try {
        return { status: 'fulfilled', value: await pSignal(signal, promise) }
    } catch (err) {
        if (isAbortError(err)) {
            return { status: 'aborted' }
        }

        throw err
    }
}

export function isAbortError(value: unknown): value is DOMException {
    return value instanceof DOMException && value.name === 'AbortError'
}

export function createAbortError(message?: string): DOMException {
    return new DOMException(message ?? 'Operation aborted.', 'AbortError')
}
