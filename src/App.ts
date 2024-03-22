import _, { LoDashStatic } from 'lodash';
import FP from 'lodash/fp';
import * as SDK from '@remnote/plugin-sdk';
import * as Helpers from './Helpers';
import distance from 'jaro-winkler';

export * as Hooks from './Hooks';

export const MONTHS = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
];

export enum PANELS {
    MAIN = '🏠 Главное',
    NUTRITION = '🍱 Питание',
    POMODORO = '🍅 Помидоры',
    RATIONS = '🍽️ Рационы',
    SYMPTOMS = '🌡️ Симптомы',
    REGIME = '🛏️ Режим',
    RITUALS = '🛞 Ритуалы',
}

const STARTING_YEAR = 2023;
const STARTING_MONTH = MONTHS.indexOf('Июнь');
const VERSION_START_DAY = new Date(2024, MONTHS.indexOf('Январь'), 7);
const ALL_SPRINT = 'Все';
const QUOTA_FACTOR = 10;

const REM_TEXT_TOTALS = 'Итоги';
const REM_TEXT_SYMPTOMS = 'Симптомы';
const REM_TEXT_REGIME = 'Режим';
const REM_TEXT_POMODORO = 'Помидоры';
const REM_TEXT_RITUALS = 'Ритуалы';
const REM_TEXT_OTHER = 'Другое';
const REM_TEXT_QUOTA = 'Квота';
const REM_TEXT_NOTES = 'Заметки';
const REM_TEXT_THESIS = 'Тезис';
const REM_TEXT_RATIONS = 'Рационы';
const REM_TEXT_CATEGORIES = 'Категории';
const REM_TEXT_FLASCARDS = 'Флешкарты';
const REM_TEXT_NEW = 'Новое';
const REM_TEXT_PRODUCTS = 'Продукты';
const REM_TEXT_FOR_PORTAL = 'Для портала';

export const REM_TEXT_START_DAY = 'Начало дня';
export const REM_TEXT_END_DAY = 'Конец дня';
export const REM_TEXT_WAKING = 'Подъём';
export const REM_TEXT_SLEEP_QUOLITY = 'Качество сна';
export const REM_TEXT_VIGOR_LEVEL = 'Уровень бодрости';
export const REM_TEXT_WAKING_TIME = 'Время бодрствования';
export const REM_TEXT_SLEEP_TIME = 'Время сна';

export const REM_TEXT_RATIONS_TIME = 'Время до';
export const REM_TEXT_RATIONS_HUNGER_BEFORE = 'Состояние до';
export const REM_TEXT_RATIONS_HUNGER_AFTER = 'Состояние после';

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
} as Pick<LoDashStatic, 'block' | 'asyncMap' | 'isNotUndefined'>);

export const log = (...args: any[]): void => {
    console.log('%cApp(%d): ', 'color: yellow', Date.now() / 1000, ...args);
};

export const years = (): number[] => {
    return _.times(new Date().getFullYear() - STARTING_YEAR + 1, FP.add(STARTING_YEAR)).reverse();
};

export const months = (year: number): string[] => {
    const now = new Date();
    if (year === now.getFullYear()) return MONTHS.slice(0, now.getMonth() + 1).reverse();
    else if (year === STARTING_YEAR) return MONTHS.slice(STARTING_MONTH).reverse();
    else return FP.reverse(MONTHS);
};

const firstSunday = (date: Date): Date => {
    if (date.getDay() === 0) return date;
    else return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (7 - date.getDay()));
};

export const sprints = (year: number, month: string): string[] => {
    const indexMonth = MONTHS.indexOf(month);
    const now = new Date();

    const firstDay = new Date(year, indexMonth, 1);
    const lastDay = _.block(() => {
        if (now.getFullYear() === year && now.getMonth() === indexMonth) return now;
        else return new Date(year, indexMonth + 1, 0);
    });

    const numbers = _.times(
        _.ceil((lastDay.getDate() - firstSunday(firstDay).getDate()) / 7) + 1,
        FP.add(1)
    );
    return numbers
        .map((num) => `${num}-й спринт`)
        .reverse()
        .concat([ALL_SPRINT]);
};

const daysInMonth = (year: number, month: number): Date[] => {
    return _.times(new Date(year, month + 1, 0).getDate(), (t) => new Date(year, month, t + 1));
};

const daysInSprint = (year: number, month: number, sprint: string): Date[] => {
    if (sprint === ALL_SPRINT) return daysInMonth(year, month);

    const sprintNumber = _.toNumber(sprint.slice(0, 1));
    const firstDayMonth = new Date(year, month, 1);
    const lastDayMonth = new Date(year, month + 1, 0);

    const firstDateSprint = firstSunday(firstDayMonth).getDate() + (sprintNumber - 1) * 7 - 6;
    const firstDaySprint = _.block(() => {
        if (sprintNumber === 1) return firstDayMonth;
        else return new Date(year, month, firstDateSprint);
    });

    const lastDateSprint = firstSunday(firstDayMonth).getDate() + (sprintNumber - 1) * 7;
    const lastDaySprint = _.block(() => {
        if (lastDateSprint >= lastDayMonth.getDate()) return lastDayMonth;
        else return new Date(year, month, lastDateSprint);
    });

    return _.block(() => {
        if (firstDaySprint.getDate() === lastDaySprint.getDate()) return [firstDaySprint];
        else
            return [
                firstDaySprint,
                ..._.times(lastDaySprint.getDate() - firstDaySprint.getDate() - 1, (t) => {
                    return new Date(year, month, firstDaySprint.getDate() + (t + 1));
                }),
                lastDaySprint,
            ];
    });
};

const isNotFuture = (date: Date): boolean => {
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

export const richTextToHtml = async (
    plugin: SDK.RNPlugin,
    richText?: SDK.RichTextInterface
): Promise<string> => {
    const ids = await plugin.richText.getRemIdsFromRichText(richText ?? []);
    await _.asyncMap(ids, plugin.rem.findOne);
    return await plugin.richText.toHTML(richText ?? []);
};

const extractTextFromHtml = (html: string): string => {
    const node = _.block(() => {
        const node = document.createElement('div');
        node.innerHTML = html;
        return node;
    });
    return node.innerText;
};

export const richTextToString = async (
    plugin: SDK.RNPlugin,
    richText?: SDK.RichTextInterface
): Promise<string> => {
    return extractTextFromHtml(await richTextToHtml(plugin, richText));
};

export interface DailyDoc {
    readonly name: string;
    readonly rem: SDK.Rem;
}

const getDailyDoc = async (plugin: SDK.RNPlugin, day: Date): Promise<SDK.Rem | undefined> => {
    const dailyPowerup = await plugin.powerup.getPowerupByCode(
        SDK.BuiltInPowerupCodes.DailyDocument
    );
    return plugin.rem.findByName([formatDateWithOrdinal(day)], dailyPowerup?._id ?? null);
};

export const dailyDocs = async (
    plugin: SDK.RNPlugin,
    year: number,
    month: string,
    sprint: string
): Promise<DailyDoc[]> => {
    const dailyRems = await _.block(async () => {
        const days = daysInSprint(year, MONTHS.indexOf(month), sprint).filter(isNotFuture);
        const rems = await _.asyncMap(days, async (day) => getDailyDoc(plugin, day));
        return rems.filter(_.isNotUndefined);
    });

    const dailyNames = await _.asyncMap(dailyRems, async (rem) => {
        return richTextToString(plugin, rem?.text);
    });

    return _.zipWith(dailyRems, dailyNames, (rem, name) => {
        return { name, rem };
    }).reverse();
};

interface Filter {
    (plugin: SDK.RNPlugin, rem: SDK.Rem): Promise<boolean>;
}

export const getRems = async (
    plugin: SDK.RNPlugin,
    rem: SDK.Rem,
    ...filters: Filter[]
): Promise<SDK.Rem[]> => {
    if (_.isEmpty(filters)) return [rem];
    const [filter, ...tailFilters] = filters;

    const filteredRem = await _.block(async () => {
        const childrenRem = await rem.getChildrenRem();
        return _.asyncMap(childrenRem, async (rem) => {
            return { rem, isFiltered: await filter(plugin, rem) };
        }).then((a) => {
            return a.filter(({ isFiltered }) => isFiltered).map(({ rem }) => rem);
        });
    });

    return _.asyncMap(filteredRem, (rem) => getRems(plugin, rem, ...tailFilters)).then((arr) => {
        return arr.reduce((res, rems) => {
            return res.concat(rems);
        }, []);
    });
};

const includesStringInRem =
    (searchString: string) =>
    async (plugin: SDK.RNPlugin, rem: SDK.Rem): Promise<boolean> => {
        if (_.isUndefined(rem.text)) return false;
        const html = await richTextToString(plugin, rem.text);
        return html.includes(searchString);
    };

export interface Symptom {
    readonly rem: SDK.Rem;
    readonly notes: {
        readonly rem: SDK.Rem;
    }[];
}

export const symptoms = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<Symptom[]> => {
    const symptomRems = await getRems(
        plugin,
        dailyRem,
        includesStringInRem(REM_TEXT_TOTALS),
        includesStringInRem(REM_TEXT_SYMPTOMS),
        async (_, rem) => {
            return !(await rem.isPowerupProperty());
        }
    );

    return _.asyncMap(symptomRems, async (symptomRem) => {
        const notes = await _.asyncMap(await symptomRem.getChildrenRem(), async (noteRem) => {
            return {
                rem: noteRem,
            };
        });

        return {
            rem: symptomRem,
            notes,
        };
    });
};

export interface Regime {
    readonly startDay: string;
    readonly endDay: string;
    readonly waking?: SDK.Rem;
    readonly sleepQuolity?: SDK.Rem;
    readonly vigorLevel?: SDK.Rem;
    readonly wakingTime: string;
    readonly sleepTime: string;
}

const parseMilitaryTimeToMinute = (time: string): number | undefined => {
    const hourAndMinute = time.split(':').map(_.trim).map(_.toNumber);
    if (_.isUndefined(hourAndMinute.at(0)) || _.isUndefined(hourAndMinute.at(1))) return;
    else return hourAndMinute[0] * 60 + hourAndMinute[1];
};

const parseMinuteToMilitaryTime = (time: number): string => {
    const hour = Math.floor(time / 60);
    const minute = time % 60;
    return `${hour < 10 ? `0${hour}` : hour}:${minute < 10 ? `0${minute}` : minute}`;
};

const convertOrdinalDateToDate = (ordinalDate: string): Date | undefined => {
    const formatDate = /(\w+)\s(\d\d?)\w\w,\s(\d{4})/;
    if (formatDate.test(ordinalDate) === false) return;
    const formattedDate = ordinalDate.replace(formatDate, '$1 $2, $3');
    return new Date(formattedDate);
};

const prevDailyDoc = async (
    plugin: SDK.RNPlugin,
    dailyRem: SDK.Rem
): Promise<SDK.Rem | undefined> => {
    const dailyDocName = await richTextToString(plugin, dailyRem.text);
    const dateOfDay = convertOrdinalDateToDate(dailyDocName);
    if (_.isUndefined(dateOfDay)) return;

    const dateOfPrevDay = new Date(
        dateOfDay.getFullYear(),
        dateOfDay.getMonth(),
        dateOfDay.getDate() - 1
    );
    const dailyPowerup = await plugin.powerup.getPowerupByCode(
        SDK.BuiltInPowerupCodes.DailyDocument
    );

    return plugin.rem.findByName([formatDateWithOrdinal(dateOfPrevDay)], dailyPowerup?._id ?? null);
};

const wakingTime = (startMinute: number, endMinute: number) => {
    if (startMinute <= endMinute) return parseMinuteToMilitaryTime(endMinute - startMinute);
    else return parseMinuteToMilitaryTime(24 * 60 - startMinute + endMinute);
};
const sleepTime = (startMinute: number, prevEndMinute: number) => {
    if (startMinute >= prevEndMinute) return parseMinuteToMilitaryTime(startMinute - prevEndMinute);
    else return parseMinuteToMilitaryTime(startMinute + (24 * 60 - prevEndMinute));
};

export const regime = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<Regime> => {
    const getOneRemInRegime = async (dailyRem: SDK.Rem, ...filters: Filter[]) => {
        return getRems(
            plugin,
            dailyRem,
            includesStringInRem(REM_TEXT_TOTALS),
            includesStringInRem(REM_TEXT_REGIME),
            ...filters
        ).then(_.head);
    };

    const startDayRem = await getOneRemInRegime(dailyRem, includesStringInRem(REM_TEXT_START_DAY));
    const startDay = await richTextToString(plugin, startDayRem?.backText);

    const endDayRem = await getOneRemInRegime(dailyRem, includesStringInRem(REM_TEXT_END_DAY));
    const endDay = await richTextToString(plugin, endDayRem?.backText);

    const isWakingRem = includesStringInRem(REM_TEXT_WAKING);
    const wakingRem = await getOneRemInRegime(dailyRem, isWakingRem);

    const isSleepQuolityRem = includesStringInRem(REM_TEXT_SLEEP_QUOLITY);
    const sleepQuolityRem = await getOneRemInRegime(dailyRem, isSleepQuolityRem);

    const isVigorLevelRem = includesStringInRem(REM_TEXT_VIGOR_LEVEL);
    const vigorLevelRem = await getOneRemInRegime(dailyRem, isVigorLevelRem);

    const prevEndDayRem = await _.block(async () => {
        const prevDayRem = await prevDailyDoc(plugin, dailyRem);
        if (_.isUndefined(prevDayRem)) return;
        else return getOneRemInRegime(prevDayRem, includesStringInRem(REM_TEXT_END_DAY));
    });

    const startDayMinute = parseMilitaryTimeToMinute(
        await richTextToString(plugin, startDayRem?.backText)
    );
    const endDayMinute = parseMilitaryTimeToMinute(
        await richTextToString(plugin, endDayRem?.backText)
    );
    const prevEndDayMinute = parseMilitaryTimeToMinute(
        await richTextToString(plugin, prevEndDayRem?.backText)
    );

    return {
        startDay,
        endDay,
        waking: wakingRem,
        sleepQuolity: sleepQuolityRem,
        vigorLevel: vigorLevelRem,
        wakingTime: await _.block(async () => {
            if (_.isUndefined(startDayMinute) || _.isUndefined(endDayMinute)) return '';
            else return richTextToString(plugin, [wakingTime(startDayMinute, endDayMinute)]);
        }),
        sleepTime: await _.block(async () => {
            if (_.isUndefined(startDayMinute) || _.isUndefined(prevEndDayMinute)) return '';
            else return richTextToString(plugin, [sleepTime(startDayMinute, prevEndDayMinute)]);
        }),
    };
};

export interface Pomodoro {
    readonly rem: SDK.Rem;
    readonly isBad: boolean;
    readonly name: string;
    readonly value: number;
}

const getRemObjectsFromRichText = async (
    plugin: SDK.RNPlugin,
    richText?: SDK.RichTextInterface
): Promise<(SDK.Rem | undefined)[]> => {
    return _.asyncMap(
        await plugin.richText.getRemIdsFromRichText(richText ?? []),
        plugin.rem.findOne
    );
};

export const pomodoros = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<Pomodoro[]> => {
    const pomodoroRems = await getRems(
        plugin,
        dailyRem,
        includesStringInRem(REM_TEXT_TOTALS),
        includesStringInRem(REM_TEXT_POMODORO),
        async (_, rem) => !(await rem.isPowerupProperty())
    );

    return _.asyncMap(pomodoroRems, async (rem) => {
        const referencedRem = await getRemObjectsFromRichText(plugin, rem.text).then(_.head);
        return {
            rem,
            isBad: (await referencedRem?.getHighlightColor()) === 'Red',
            name: await richTextToString(plugin, rem?.text),
            value: _.toNumber(await richTextToString(plugin, rem.backText)),
        };
    });
};

export const calculateTotalsPomodoros = (listPomodoros: Pomodoro[][]): Pomodoro[] => {
    const groupOfPomodoros = _.groupBy(_.flatten(listPomodoros), ({ name }) => name);
    return _.chain(groupOfPomodoros)
        .map((pomodoros) => {
            return pomodoros.reduce((result, pomodoro) => {
                return {
                    ...pomodoro,
                    value: (result.value ?? 0) + pomodoro.value,
                };
            }, {} as Pomodoro);
        })
        .sortBy(({ name }) => name)
        .value();
};

export interface Ritual {
    readonly rem: SDK.Rem;
}

export const rituals = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<Ritual[]> => {
    const ritualRems = await getRems(
        plugin,
        dailyRem,
        includesStringInRem(REM_TEXT_TOTALS),
        includesStringInRem(REM_TEXT_RITUALS),
        async (_, rem) => !(await rem.isPowerupProperty())
    );

    return ritualRems.map((rem) => {
        return { rem };
    });
};

export interface Other {
    readonly rem: SDK.Rem;
}

export const others = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<Other[]> => {
    const otherRems = await getRems(
        plugin,
        dailyRem,
        includesStringInRem(REM_TEXT_TOTALS),
        includesStringInRem(REM_TEXT_OTHER),
        async (_, rem) => !(await rem.isPowerupProperty())
    );

    return otherRems.map((rem) => {
        return { rem };
    });
};

export const version = (dailyDocName: string): number => {
    const dateOfDay = convertOrdinalDateToDate(dailyDocName);
    if (_.isUndefined(dateOfDay)) return -1;
    const msInDay = 1000 * 60 * 60 * 24;
    return _.ceil((dateOfDay.getTime() - VERSION_START_DAY.getTime()) / msInDay) + 1;
};

export const daysUntilEndOfMonth = (dailyDocName: string): number => {
    const dateOfDay = convertOrdinalDateToDate(dailyDocName);
    if (_.isUndefined(dateOfDay)) return -1;
    const lastDay = new Date(dateOfDay.getFullYear(), dateOfDay.getMonth() + 1, 0);
    return lastDay.getDate() - dateOfDay.getDate();
};

export const notesCount = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<number> => {
    const notesRem = await getRems(plugin, dailyRem, includesStringInRem(REM_TEXT_NOTES)).then(
        _.head
    );

    if (_.isUndefined(notesRem)) return 0;
    else return notesRem.getDescendants().then((d) => d.length - 1);
};

const hasTagInRem: (tagName: string) => Filter = (tagName) => async (plugin, rem) => {
    const tags = await rem.getTagRems();
    return _.asyncMap(tags, async (rem) => {
        const name = await richTextToString(plugin, rem.text);
        return name.includes(tagName);
    }).then(FP.includes(true));
};

const splitString = (text: string, separators: string[]): string[] => {
    if (_.isEmpty(separators)) return [text];
    const [separator, ...tailSeparators] = separators;
    return text.split(separator).flatMap((text) => {
        return splitString(text, tailSeparators);
    });
};

const splitTextInHtml = (html: Node | string, ...separators: string[]): string[] => {
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

export interface Thesis {
    readonly embeddedHtml: string;
    readonly color: string;
    readonly isGood: boolean;
    readonly isEvent: boolean;
    readonly isBad: boolean;
    readonly isInfo: boolean;
}

export const theses = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<Thesis[]> => {
    const thesesRem = await getRems(
        plugin,
        dailyRem,
        includesStringInRem(REM_TEXT_NOTES),
        hasTagInRem(REM_TEXT_THESIS)
    ).then(_.head);

    const extractThesisFromHtml = (html: string) => {
        const node = _.block(() => {
            const node = document.createElement('div');
            node.innerHTML = html;
            return node;
        });

        const marks = node.querySelectorAll('mark');
        const color = _.block(() => {
            const firstMark = _.first(
                _.filter(marks, (mark) => {
                    return _.isEmpty(mark.innerText.trim()) === false;
                })
            );
            if (_.isUndefined(firstMark)) return '';
            return firstMark.style.backgroundColor;
        });

        _.forEach(marks, (mark) => {
            mark.outerHTML = mark.innerText;
        });

        return {
            color,
            embeddedHtml: node.innerHTML,
            text: node.innerText.trim(),
            isGood: ['yellow', 'green'].includes(color),
            isEvent: ['blue', 'purple'].includes(color),
            isBad: ['red', 'orange'].includes(color),
            isInfo: _.isEmpty(color),
        };
    };

    return splitTextInHtml(await Helpers.richTextToEmbeddedHtml(plugin, thesesRem?.text), '.')
        .map(extractThesisFromHtml)
        .filter(({ text }) => _.isEmpty(text) === false);
};

const splitArray = <T>(arr: T[], isDelimiter: (i: T) => boolean): T[][] => {
    return arr.reduce((result, item) => {
        if (isDelimiter(item)) return [...result, []];
        const lastArray = _.last(result) ?? [];
        return result.slice(0, -1).concat([[...lastArray, item]]);
    }, [] as T[][]);
};

export interface Food {
    readonly rem: SDK.Rem;
    readonly productRems: SDK.Rem[];
    readonly categories: string[];
    readonly portion: number;
    readonly unit: string;
}

export interface Ration {
    readonly time?: string;
    readonly hungerBefore?: SDK.Rem;
    readonly hungerAfter?: SDK.Rem;
    readonly snacks: Food[][];
}

const extractUnitFromString = (str: string): string => {
    return str.replace(/.+?([A-zА-я]+)/, '$1');
};

const roundToHundredths = (num: number): number => {
    return _.floor(num * 100) / 100;
};

const extractPortionFromString = (str: string): number => {
    const d = str.match(/\d+/g)?.map(_.toNumber);
    if (!d) return 0;
    else if (d.length === 1) return d[0];
    else if (d.length === 2) return roundToHundredths(d[0] / d[1]);
    else if (d.length === 3) return roundToHundredths(d[0] + d[1] / d[2]);
    else return 0;
};

export const rations = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<Ration[]> => {
    const rationRems = await getRems(
        plugin,
        dailyRem,
        includesStringInRem(REM_TEXT_RATIONS),
        async (plugin, rem) => {
            const text = await richTextToString(plugin, rem.text);
            return _.isInteger(_.toNumber(text.charAt(0)));
        }
    );

    const times = await _.asyncMap(rationRems, async (rem) => {
        const timeRem = await getRems(plugin, rem, includesStringInRem(REM_TEXT_RATIONS_TIME)).then(
            _.first
        );
        if (_.isUndefined(timeRem)) return;
        else return richTextToString(plugin, timeRem?.backText);
    });

    const listHungerBefore = await _.asyncMap(rationRems, async (rem) => {
        return getRems(plugin, rem, includesStringInRem(REM_TEXT_RATIONS_HUNGER_BEFORE)).then(
            _.first
        );
    });

    const listHungerAfter = await _.asyncMap(rationRems, async (rem) => {
        return getRems(plugin, rem, includesStringInRem(REM_TEXT_RATIONS_HUNGER_AFTER)).then(
            _.first
        );
    });

    const snacks = await _.asyncMap(rationRems, async (rem) => {
        const foodRems = await getRems(plugin, rem, async (__, rem) => {
            const includes = (str: string) => includesStringInRem(str)(plugin, rem);
            if (await rem.isPowerupProperty()) return false;
            else if (await includes(REM_TEXT_RATIONS_TIME)) return false;
            else if (await includes(REM_TEXT_RATIONS_HUNGER_BEFORE)) return false;
            else if (await includes(REM_TEXT_RATIONS_HUNGER_AFTER)) return false;
            else if (_.isEmpty(_.trim(await richTextToString(plugin, rem.text)))) return false;
            else return true;
        });

        const rawFoods = await _.asyncMap(foodRems, async (rem) => {
            const productRems = await getRemObjectsFromRichText(plugin, rem.text).then(
                FP.filter(_.isNotUndefined)
            );

            const categories = await _.asyncMap(productRems, async (rem) => {
                const categoryRem = await getRems(
                    plugin,
                    rem,
                    includesStringInRem(REM_TEXT_CATEGORIES)
                ).then(_.first);

                return (await richTextToString(plugin, categoryRem?.backText)).split(',');
            });

            const value = await richTextToString(plugin, rem.backText);
            return {
                rem,
                value,
                productRems,
                name: await richTextToString(plugin, rem.text),
                portion: extractPortionFromString(value),
                unit: extractUnitFromString(value),
                categories: _.flatten(categories),
            };
        });

        return splitArray(rawFoods, ({ name }) => name.trim() === '~');
    });

    return _.zipWith(
        times,
        listHungerBefore,
        listHungerAfter,
        snacks,
        (time, hungerBefore, hungerAfter, snacks) => {
            return { time, hungerBefore, hungerAfter, snacks };
        }
    );
};

interface NutritionProductTotal {
    readonly eaten: number;
    readonly unit: string;
}

interface NutritionProduct {
    readonly rem: SDK.Rem;
    readonly totals: NutritionProductTotal[];
    readonly categories: string[];
    readonly foods: Food[];
}

const compareInaccurately = (str1: string, str2: string) => distance(str1, str2) > 0.75;

export interface NutritionCategory {
    category: string;
    products: NutritionProduct[];
}

export const nutrition = async (
    plugin: SDK.RNPlugin,
    rations: Ration[]
): Promise<NutritionCategory[]> => {
    const allFoods = _.flatten(rations.flatMap(({ snacks }) => snacks));
    const allProductRems = _.uniqBy(
        _.flatMap(allFoods, ({ productRems }) => productRems),
        ({ _id }) => _id
    );

    const products = await _.asyncMap(allProductRems, async (productRem) => {
        const foodsByProductId = allFoods.filter(({ productRems }) => {
            return _.find(productRems, { _id: productRem._id });
        });

        const units = _.uniqWith(
            _.map(foodsByProductId, ({ unit }) => unit),
            (unit1, unit2) => {
                return compareInaccurately(unit1, unit2);
            }
        );

        const foodsByUnits = units.map((unit) => {
            return foodsByProductId.filter((food) => compareInaccurately(food.unit, unit));
        });

        return {
            rem: productRem,
            foods: foodsByProductId,
            totals: foodsByUnits.map((foods) => {
                return _.reduce(
                    foods,
                    (result, food) => {
                        return {
                            eaten: roundToHundredths(result.eaten + food.portion),
                            unit: food.unit,
                        };
                    },
                    {
                        eaten: 0,
                        unit: '',
                    }
                );
            }),
            categories: await _.block(async () => {
                const categoryRem = await getRems(
                    plugin,
                    productRem,
                    includesStringInRem(REM_TEXT_CATEGORIES)
                ).then(_.first);
                return _.split(await richTextToString(plugin, categoryRem?.backText), ',');
            }),
        };
    });

    const allCategories = _.uniq(allFoods.flatMap(({ categories }) => categories));
    const productsByCategories = allCategories.map((category) => {
        return products.filter(({ categories }) => {
            return categories.includes(category);
        });
    });

    const nutritionCategories = _.zipWith(
        allCategories,
        productsByCategories,
        (category, products) => {
            return { category, products };
        }
    );
    return _.sortBy(nutritionCategories, ['category']);
};

export const incrementRitualFlashcards = async (plugin: SDK.RNPlugin): Promise<void> => {
    const todaysRem = await plugin.date.getTodaysDoc();
    if (_.isUndefined(todaysRem)) return;

    const flashcardRem = await getRems(
        plugin,
        todaysRem,
        includesStringInRem(REM_TEXT_TOTALS),
        includesStringInRem(REM_TEXT_RITUALS),
        includesStringInRem(REM_TEXT_FLASCARDS)
    ).then(_.first);
    if (_.isUndefined(flashcardRem)) return;

    const value = _.toNumber(await richTextToString(plugin, flashcardRem.backText));
    await flashcardRem.setBackText([_.isNaN(value) ? '1' : _.toString(value + 1)]);
};

export const removeEmptyChildProperties = async (
    plugin: SDK.RNPlugin,
    rem: SDK.Rem
): Promise<void> => {
    const emptyPropertyRems = await getRems(plugin, rem, async (plugin, rem) => {
        const referencedRem = await getRemObjectsFromRichText(plugin, rem.text).then(_.head);
        if (_.isUndefined(referencedRem)) return false;
        if (!(await referencedRem.isProperty())) return false;

        const backText = await richTextToString(plugin, rem.backText);
        const value = backText.trim();

        if (value === 'No') return true;
        else if (_.isEmpty(value.length)) return true;
        else return false;
    });

    await _.asyncMap(emptyPropertyRems, (rem) => rem.remove());
};

export const findDailyDocInAncestors = async (rem: SDK.Rem): Promise<SDK.Rem | undefined> => {
    if (await rem.hasPowerup(SDK.BuiltInPowerupCodes.DailyDocument)) return rem;
    const parentRem = await rem.getParentRem();
    if (_.isUndefined(parentRem)) return;
    else return findDailyDocInAncestors(parentRem);
};

const roundToTens = (num: number): number => {
    return _.round(num * 10) / 10;
};

export const calculateAndSetQuota = async (
    plugin: SDK.RNPlugin,
    dailyRem: SDK.Rem
): Promise<void> => {
    const prevDailyRem = await prevDailyDoc(plugin, dailyRem);
    if (_.isUndefined(prevDailyRem)) return void plugin.app.toast('Предыдущего дня не существует');

    const getQuotaRem = (rem: SDK.Rem) => {
        return getRems(
            plugin,
            rem,
            includesStringInRem(REM_TEXT_TOTALS),
            includesStringInRem(REM_TEXT_OTHER),
            includesStringInRem(REM_TEXT_QUOTA)
        ).then(_.head);
    };

    const prevQuotaRem = await getQuotaRem(prevDailyRem);
    const prevQuota = _.toNumber(await richTextToString(plugin, prevQuotaRem?.backText));
    if (_.isNaN(prevQuota)) return void plugin.app.toast('Некорректный формат предыдущей квоты');

    const listPomodoros = await pomodoros(plugin, dailyRem);
    const [goodSumPom, badSumPom] = listPomodoros.reduce(
        ([goodSum, badSum], pomodoro) => {
            if (pomodoro.isBad) return [goodSum, badSum + pomodoro.value];
            else return [goodSum + pomodoro.value, badSum];
        },
        [0, 0] as [number, number]
    );

    const quota = roundToTens(goodSumPom / QUOTA_FACTOR - badSumPom + prevQuota);
    const quotaRem = await getQuotaRem(dailyRem);
    quotaRem?.setBackText([_.toString(quota)]);
};

const eraseSearchPrefix = async (plugin: SDK.RNPlugin, rem: SDK.Rem): Promise<void> => {
    const rawRichText = rem.text;
    if (_.isUndefined(rawRichText)) return;

    const { replaceAllRichText, trimStart } = plugin.richText;
    const richText = await replaceAllRichText(rawRichText, ['(+)'], ['']).then(trimStart);
    await rem.setText(richText);
};

const expandProductEnvironment = async (
    plugin: SDK.RNPlugin,
    dailyRem: SDK.Rem
): Promise<SDK.Rem | undefined> => {
    const productsRem = await _.block(async () => {
        const productsRem = await getRems(
            plugin,
            dailyRem,
            includesStringInRem(REM_TEXT_PRODUCTS)
        ).then(_.head);
        if (_.isNotUndefined(productsRem)) return productsRem;

        const rem = await plugin.rem.createRem();
        await rem?.setParent(dailyRem);
        await rem?.setText([REM_TEXT_PRODUCTS]);
        await rem?.setFontSize('H1');
        return rem;
    });
    if (_.isUndefined(productsRem)) return;

    return await _.block(async () => {
        const rem = await plugin.rem.createRem();
        await rem?.setParent(productsRem);
        await rem?.setText(['(+) ' + REM_TEXT_FOR_PORTAL]);
        return rem;
    });
};

const collapseProductEnvironment = async (
    plugin: SDK.RNPlugin,
    dailyRem: SDK.Rem
): Promise<void> => {
    const allProductRemsWithSearchPrefix = await getRems(
        plugin,
        dailyRem,
        includesStringInRem(REM_TEXT_PRODUCTS),
        includesStringInRem('(+)')
    );

    await _.asyncMap(allProductRemsWithSearchPrefix, async (rem) => {
        return eraseSearchPrefix(plugin, rem);
    });

    const forPortalRem = await getRems(
        plugin,
        dailyRem,
        includesStringInRem(REM_TEXT_PRODUCTS),
        includesStringInRem(REM_TEXT_FOR_PORTAL)
    ).then(_.head);
    await forPortalRem?.remove();
};

export const addPortalProduct = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<void> => {
    const docName = await richTextToString(plugin, dailyRem.text);
    const docDate = convertOrdinalDateToDate(docName);
    if (_.isUndefined(docDate)) return;

    const { toast } = plugin.app;
    const firstDayDate = new Date(docDate.getFullYear(), docDate.getMonth(), 1);
    const firstDayRem = await getDailyDoc(plugin, firstDayDate);
    if (_.isUndefined(firstDayRem)) return void toast('Нет первого дня месяца');

    const forPortalRem = await _.block(async () => {
        const forPortalRem = await getRems(
            plugin,
            firstDayRem,
            includesStringInRem(REM_TEXT_PRODUCTS),
            includesStringInRem(REM_TEXT_FOR_PORTAL)
        ).then(_.head);
        if (_.isNotUndefined(forPortalRem)) return forPortalRem;

        const prevFirstDayDate = new Date(docDate.getFullYear(), docDate.getMonth() - 1, 1);
        const prevFirstDayRem = await getDailyDoc(plugin, prevFirstDayDate);
        if (_.isUndefined(prevFirstDayRem)) return void toast('Нет первого дня прошлого месяца');

        await collapseProductEnvironment(plugin, prevFirstDayRem);
        return await expandProductEnvironment(plugin, firstDayRem);
    });
    if (_.isUndefined(forPortalRem)) return void toast('Rem "Для портала" почему-то не создан');

    const newRem = await getRems(
        plugin,
        dailyRem,
        includesStringInRem(REM_TEXT_RATIONS),
        includesStringInRem(REM_TEXT_NEW)
    ).then(_.head);
    if (_.isUndefined(newRem)) return void toast('Rem "Новое" не найден');

    const portal = await plugin.rem.createPortal();
    if (_.isUndefined(portal)) return void toast('Портал почему-то не создан');

    await portal?.setParent(newRem);
    await forPortalRem.addToPortal(portal);
};
