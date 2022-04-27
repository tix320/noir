type AnyValue = number | string | boolean | object;

export class ValidationError extends Error { }

export class AssertionError extends Error { }

//TODO: use this method in validation places
export function validate<T extends AnyValue>(value: AnyValue | null | undefined, message: string): asserts value is T {
    if (!value) {
        throw new ValidationError(message);
    }
}

export function assert<T extends AnyValue>(value: AnyValue | null | undefined, message: string = 'Illegal State'): asserts value is T {
    if (!value) {
        throw new AssertionError(message);
    }
}