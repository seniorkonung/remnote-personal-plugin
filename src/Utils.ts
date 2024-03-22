import _ from 'lodash';
import distance from 'jaro-winkler';

declare module 'lodash' {
    interface LoDashStatic {
        block<T>(fn: () => T): T;
        asyncMap<T1, T2>(
            arr: T1[],
            callbackFn: (v: T1, i: number, arr: T1[]) => Promise<T2>
        ): Promise<T2[]>;
        isNotUndefined<T>(v?: T): v is T;
    }
}
_.mixin({
    block(fn) {
        return fn();
    },
    asyncMap(arr, callbackFn) {
        return Promise.all(arr.map(callbackFn));
    },
    isNotUndefined(v) {
        return v !== undefined;
    },
} as Pick<_.LoDashStatic, 'block' | 'asyncMap' | 'isNotUndefined'>);

export const log = (...args: any[]): void => {
    console.log('%cApp(%d): ', 'color: yellow', Date.now() / 1000, ...args);
};

export const firstSunday = (date: Date): Date => {
    if (date.getDay() === 0) return date;
    else return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (7 - date.getDay()));
};

export const daysOfMonth = (year: number, month: number): Date[] => {
    return _.times(new Date(year, month + 1, 0).getDate(), (t) => new Date(year, month, t + 1));
};

export const isNotFutureDate = (date: Date): boolean => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const now = new Date();
    const yearNow = now.getFullYear();
    const monthNow = now.getMonth();
    const dayNow = now.getDate();

    if (yearNow < year) return false;
    else if (yearNow === year && monthNow < month) return false;
    else if (yearNow === year && monthNow === month && dayNow < day) return false;
    else return true;
};

export const formatDateWithOrdinal = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const day = date.getDate();

    const nth = (num: number) => {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        if (num > 0) return suffixes[(num > 3 && num < 21) || num % 10 > 3 ? 0 : num % 10];
        else return '';
    };

    return `${month} ${day}${nth(day)}, ${year}`;
};

export const parseMilitaryTimeToMinute = (time: string): number | undefined => {
    const hourAndMinute = time.split(':').map(_.trim).map(_.toNumber);
    if (_.isUndefined(hourAndMinute.at(0)) || _.isUndefined(hourAndMinute.at(1))) return;
    else return hourAndMinute[0] * 60 + hourAndMinute[1];
};

export const parseMinuteToMilitaryTime = (time: number): string => {
    const hour = Math.floor(time / 60);
    const minute = time % 60;
    return `${hour < 10 ? `0${hour}` : hour}:${minute < 10 ? `0${minute}` : minute}`;
};

export const convertOrdinalDateToDate = (ordinalDate: string): Date | undefined => {
    const formatDate = /(\w+)\s(\d\d?)\w\w,\s(\d{4})/;
    if (formatDate.test(ordinalDate) === false) return;
    const formattedDate = ordinalDate.replace(formatDate, '$1 $2, $3');
    return new Date(formattedDate);
};

export const splitString = (text: string, separators: string[]): string[] => {
    if (_.isEmpty(separators)) return [text];
    const [separator, ...tailSeparators] = separators;
    return text.split(separator).flatMap((text) => {
        return splitString(text, tailSeparators);
    });
};

export const splitTextInHtml = (html: Node | string, ...separators: string[]): string[] => {
    const node = _.block(() => {
        if (_.isString(html) === false) return html;
        const node = document.createElement('div');
        node.innerHTML = html;
        return node;
    });

    if (node.nodeType === node.TEXT_NODE) {
        return splitString(node.textContent ?? '', separators).map((text) => {
            if (_.isNull(node?.parentNode?.parentNode)) return text;

            const cloneNode = node.parentNode.cloneNode();
            if ('innerText' in cloneNode === false) return text;
            if ('outerHTML' in cloneNode === false) return text;

            cloneNode.innerText = text;
            return cloneNode.outerHTML as string;
        });
    } else {
        return _.reduce(
            node.childNodes,
            (result, node) => {
                const strings = splitTextInHtml(node, ...separators);
                const head = _.head(strings) ?? '';
                const tail = _.tail(strings);
                const lastResult = _.last(result) ?? '';
                return [...result.slice(0, -1), lastResult + head, ...tail];
            },
            [] as string[]
        );
    }
};

export const splitArray = <T>(arr: T[], isDelimiter: (i: T) => boolean): T[][] => {
    return arr.reduce((result, item) => {
        if (isDelimiter(item)) return [...result, []];
        const lastArray = _.last(result) ?? [];
        return result.slice(0, -1).concat([[...lastArray, item]]);
    }, [] as T[][]);
};

export const roundToHundredths = (num: number): number => {
    return _.floor(num * 100) / 100;
};

export const roundToTens = (num: number): number => {
    return _.round(num * 10) / 10;
};

export const compareStringsInaccurately = (str1: string, str2: string) => {
    return distance(str1, str2) > 0.75;
};
