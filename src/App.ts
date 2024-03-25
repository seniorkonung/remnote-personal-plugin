import _ from 'lodash';
import FP from 'lodash/fp';
import * as SDK from '@remnote/plugin-sdk';
import * as Helpers from './Helpers';
import * as Utils from './Utils';

export * as Hooks from './Hooks';
export * as Utils from './Utils';
export * as Helpers from './Helpers';

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

export const years = (): number[] => {
    return _.times(new Date().getFullYear() - STARTING_YEAR + 1, FP.add(STARTING_YEAR)).reverse();
};

export const months = (year: number): string[] => {
    const now = new Date();
    if (year === now.getFullYear()) return MONTHS.slice(0, now.getMonth() + 1).reverse();
    else if (year === STARTING_YEAR) return MONTHS.slice(STARTING_MONTH).reverse();
    else return FP.reverse(MONTHS);
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
        _.ceil((lastDay.getDate() - Utils.firstSunday(firstDay).getDate()) / 7) + 1,
        FP.add(1)
    );
    return numbers
        .map((num) => `${num}-й спринт`)
        .reverse()
        .concat([ALL_SPRINT]);
};

const daysOfSprint = (year: number, month: number, sprint: string): Date[] => {
    if (sprint === ALL_SPRINT) return Utils.daysOfMonth(year, month);

    const sprintNumber = _.toNumber(sprint.slice(0, 1));
    const firstDayMonth = new Date(year, month, 1);
    const lastDayMonth = new Date(year, month + 1, 0);

    const firstDateSprint = Utils.firstSunday(firstDayMonth).getDate() + (sprintNumber - 1) * 7 - 6;
    const firstDaySprint = _.block(() => {
        if (sprintNumber === 1) return firstDayMonth;
        else return new Date(year, month, firstDateSprint);
    });

    const lastDateSprint = Utils.firstSunday(firstDayMonth).getDate() + (sprintNumber - 1) * 7;
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

export interface DailyDoc {
    readonly name: string;
    readonly rem: SDK.Rem;
}

export const dailyDocs = async (
    plugin: SDK.RNPlugin,
    year: number,
    month: string,
    sprint: string
): Promise<DailyDoc[]> => {
    const dailyRems = await _.block(async () => {
        const days = daysOfSprint(year, MONTHS.indexOf(month), sprint).filter(
            Utils.isNotFutureDate
        );
        const rems = await _.asyncMap(days, async (day) => Helpers.getDailyDoc(plugin, day));
        return rems.filter(_.isNotUndefined);
    });

    const dailyNames = await _.asyncMap(dailyRems, async (rem) => {
        return Helpers.richTextToString(plugin, rem?.text);
    });

    return _.zipWith(dailyRems, dailyNames, (rem, name) => {
        return { name, rem };
    }).reverse();
};

export interface Symptom {
    readonly rem: SDK.Rem;
    readonly notes: {
        readonly rem: SDK.Rem;
    }[];
}

export const symptoms = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<Symptom[]> => {
    const symptomRems = await Helpers.getRems(
        plugin,
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_TOTALS),
        Helpers.includesStringInRem(REM_TEXT_SYMPTOMS),
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

const wakingTime = (startMinute: number, endMinute: number) => {
    if (startMinute <= endMinute) return Utils.parseMinuteToMilitaryTime(endMinute - startMinute);
    else return Utils.parseMinuteToMilitaryTime(24 * 60 - startMinute + endMinute);
};
const sleepTime = (startMinute: number, prevEndMinute: number) => {
    if (startMinute >= prevEndMinute)
        return Utils.parseMinuteToMilitaryTime(startMinute - prevEndMinute);
    else return Utils.parseMinuteToMilitaryTime(startMinute + (24 * 60 - prevEndMinute));
};

export const regime = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<Regime> => {
    const getOneRemInRegime = async (dailyRem: SDK.Rem, ...filters: Helpers.Filter[]) => {
        return Helpers.getRems(
            plugin,
            dailyRem,
            Helpers.includesStringInRem(REM_TEXT_TOTALS),
            Helpers.includesStringInRem(REM_TEXT_REGIME),
            ...filters
        ).then(_.head);
    };

    const startDayRem = await getOneRemInRegime(
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_START_DAY)
    );
    const startDay = await Helpers.richTextToString(plugin, startDayRem?.backText);

    const endDayRem = await getOneRemInRegime(
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_END_DAY)
    );
    const endDay = await Helpers.richTextToString(plugin, endDayRem?.backText);

    const isWakingRem = Helpers.includesStringInRem(REM_TEXT_WAKING);
    const wakingRem = await getOneRemInRegime(dailyRem, isWakingRem);

    const isSleepQuolityRem = Helpers.includesStringInRem(REM_TEXT_SLEEP_QUOLITY);
    const sleepQuolityRem = await getOneRemInRegime(dailyRem, isSleepQuolityRem);

    const isVigorLevelRem = Helpers.includesStringInRem(REM_TEXT_VIGOR_LEVEL);
    const vigorLevelRem = await getOneRemInRegime(dailyRem, isVigorLevelRem);

    const prevEndDayRem = await _.block(async () => {
        const prevDayRem = await Helpers.prevDailyDoc(plugin, dailyRem);
        if (_.isUndefined(prevDayRem)) return;
        else return getOneRemInRegime(prevDayRem, Helpers.includesStringInRem(REM_TEXT_END_DAY));
    });

    const startDayMinute = Utils.parseMilitaryTimeToMinute(
        await Helpers.richTextToString(plugin, startDayRem?.backText)
    );
    const endDayMinute = Utils.parseMilitaryTimeToMinute(
        await Helpers.richTextToString(plugin, endDayRem?.backText)
    );
    const prevEndDayMinute = Utils.parseMilitaryTimeToMinute(
        await Helpers.richTextToString(plugin, prevEndDayRem?.backText)
    );

    return {
        startDay,
        endDay,
        waking: wakingRem,
        sleepQuolity: sleepQuolityRem,
        vigorLevel: vigorLevelRem,
        wakingTime: await _.block(async () => {
            if (_.isUndefined(startDayMinute) || _.isUndefined(endDayMinute)) return '';
            else
                return Helpers.richTextToString(plugin, [wakingTime(startDayMinute, endDayMinute)]);
        }),
        sleepTime: await _.block(async () => {
            if (_.isUndefined(startDayMinute) || _.isUndefined(prevEndDayMinute)) return '';
            else
                return Helpers.richTextToString(plugin, [
                    sleepTime(startDayMinute, prevEndDayMinute),
                ]);
        }),
    };
};

export interface Pomodoro {
    readonly rem: SDK.Rem;
    readonly isBad: boolean;
    readonly name: string;
    readonly value: number;
}

export const pomodoros = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<Pomodoro[]> => {
    const pomodoroRems = await Helpers.getRems(
        plugin,
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_TOTALS),
        Helpers.includesStringInRem(REM_TEXT_POMODORO),
        async (_, rem) => !(await rem.isPowerupProperty())
    );

    return _.asyncMap(pomodoroRems, async (rem) => {
        const referencedRem = await Helpers.getReferencedRemsFromRichText(plugin, rem.text).then(
            _.head
        );
        return {
            rem,
            isBad:
                _.isNotUndefined(referencedRem) &&
                _.isEqual(await Helpers.getHighlightColor(referencedRem), 'red'),
            name: await Helpers.richTextToString(plugin, rem?.text),
            value: _.toNumber(await Helpers.richTextToString(plugin, rem.backText)),
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
    const ritualRems = await Helpers.getRems(
        plugin,
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_TOTALS),
        Helpers.includesStringInRem(REM_TEXT_RITUALS),
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
    const otherRems = await Helpers.getRems(
        plugin,
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_TOTALS),
        Helpers.includesStringInRem(REM_TEXT_OTHER),
        async (_, rem) => !(await rem.isPowerupProperty())
    );

    return otherRems.map((rem) => {
        return { rem };
    });
};

export const daysUntilEndOfYear = (dailyDocName: string): number => {
    const dateOfDay = Utils.convertOrdinalDateToDate(dailyDocName);
    if (_.isUndefined(dateOfDay)) return -1;
    const lastDay = new Date(dateOfDay.getFullYear() + 1, MONTHS.indexOf('Январь'), 0);
    const msInDay = 1000 * 60 * 60 * 24;
    return _.ceil((lastDay.getTime() - dateOfDay.getTime()) / msInDay);
};

export const daysUntilEndOfMonth = (dailyDocName: string): number => {
    const dateOfDay = Utils.convertOrdinalDateToDate(dailyDocName);
    if (_.isUndefined(dateOfDay)) return -1;
    const lastDay = new Date(dateOfDay.getFullYear(), dateOfDay.getMonth() + 1, 0);
    return lastDay.getDate() - dateOfDay.getDate();
};

export const notesCount = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<number> => {
    const notesRem = await Helpers.getRems(
        plugin,
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_NOTES)
    ).then(_.head);

    if (_.isUndefined(notesRem)) return 0;
    else return notesRem.getDescendants().then((d) => d.length - 1);
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
    const thesesRem = await Helpers.getRems(
        plugin,
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_NOTES),
        Helpers.hasTagInRem(REM_TEXT_THESIS)
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
            return Helpers.stringToColor(firstMark.style.backgroundColor) ?? '';
        });

        _.forEach(marks, (mark) => {
            mark.outerHTML = mark.innerText;
        });

        return {
            color,
            embeddedHtml: node.innerHTML,
            text: node.innerText.trim(),
            isGood: 'yellow' === color || 'green' === color,
            isEvent: 'blue' === color || 'purple' === color,
            isBad: 'red' === color || 'orange' === color,
            isInfo: '' === color,
        };
    };

    return Utils.splitTextInHtml(await Helpers.richTextToEmbeddedHtml(plugin, thesesRem?.text), '.')
        .map(extractThesisFromHtml)
        .filter(({ text }) => _.isEmpty(text) === false);
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

const extractPortionFromString = (str: string): number => {
    const d = str.match(/\d+/g)?.map(_.toNumber);
    if (!d) return 0;
    else if (d.length === 1) return d[0];
    else if (d.length === 2) return Utils.roundToHundredths(d[0] / d[1]);
    else if (d.length === 3) return Utils.roundToHundredths(d[0] + d[1] / d[2]);
    else return 0;
};

export const rations = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<Ration[]> => {
    const rationRems = await Helpers.getRems(
        plugin,
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_RATIONS),
        async (plugin, rem) => {
            const text = await Helpers.richTextToString(plugin, rem.text);
            return _.isInteger(_.toNumber(text.charAt(0)));
        }
    );

    const times = await _.asyncMap(rationRems, async (rem) => {
        const timeRem = await Helpers.getRems(
            plugin,
            rem,
            Helpers.includesStringInRem(REM_TEXT_RATIONS_TIME)
        ).then(_.first);
        if (_.isUndefined(timeRem)) return;
        else return Helpers.richTextToString(plugin, timeRem?.backText);
    });

    const listHungerBefore = await _.asyncMap(rationRems, async (rem) => {
        return Helpers.getRems(
            plugin,
            rem,
            Helpers.includesStringInRem(REM_TEXT_RATIONS_HUNGER_BEFORE)
        ).then(_.first);
    });

    const listHungerAfter = await _.asyncMap(rationRems, async (rem) => {
        return Helpers.getRems(
            plugin,
            rem,
            Helpers.includesStringInRem(REM_TEXT_RATIONS_HUNGER_AFTER)
        ).then(_.first);
    });

    const snacks = await _.asyncMap(rationRems, async (rem) => {
        const foodRems = await Helpers.getRems(plugin, rem, async (__, rem) => {
            const includes = (str: string) => Helpers.includesStringInRem(str)(plugin, rem);
            if (await rem.isPowerupProperty()) return false;
            else if (await includes(REM_TEXT_RATIONS_TIME)) return false;
            else if (await includes(REM_TEXT_RATIONS_HUNGER_BEFORE)) return false;
            else if (await includes(REM_TEXT_RATIONS_HUNGER_AFTER)) return false;
            else if (_.isEmpty(_.trim(await Helpers.richTextToString(plugin, rem.text))))
                return false;
            else return true;
        });

        const rawFoods = await _.asyncMap(foodRems, async (rem) => {
            const productRems = await Helpers.getReferencedRemsFromRichText(plugin, rem.text).then(
                FP.filter(_.isNotUndefined)
            );

            const categories = await _.asyncMap(productRems, async (rem) => {
                const categoryRem = await Helpers.getRems(
                    plugin,
                    rem,
                    Helpers.includesStringInRem(REM_TEXT_CATEGORIES)
                ).then(_.first);

                return (await Helpers.richTextToString(plugin, categoryRem?.backText)).split(',');
            });

            const value = await Helpers.richTextToString(plugin, rem.backText);
            return {
                rem,
                value,
                productRems,
                name: await Helpers.richTextToString(plugin, rem.text),
                portion: extractPortionFromString(value),
                unit: extractUnitFromString(value),
                categories: _.flatten(categories),
            };
        });

        return Utils.splitArray(rawFoods, ({ name }) => name.trim() === '~');
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
                return Utils.compareStringsInaccurately(unit1, unit2);
            }
        );

        const foodsByUnits = units.map((unit) => {
            return foodsByProductId.filter((food) =>
                Utils.compareStringsInaccurately(food.unit, unit)
            );
        });

        return {
            rem: productRem,
            foods: foodsByProductId,
            totals: foodsByUnits.map((foods) => {
                return _.reduce(
                    foods,
                    (result, food) => {
                        return {
                            eaten: Utils.roundToHundredths(result.eaten + food.portion),
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
                const allIngredientsRems = await Helpers.deepReferencedRemsFromRichText(
                    plugin,
                    productRem.text
                ).then(FP.filter(_.isNotUndefined));

                const categoryRems = await _.asyncMap(
                    [productRem, ...allIngredientsRems],
                    async (rem) => {
                        return Helpers.getRems(
                            plugin,
                            rem,
                            Helpers.includesStringInRem(REM_TEXT_CATEGORIES)
                        ).then(_.first);
                    }
                ).then(FP.filter(_.isNotUndefined));

                if (_.isEmpty(categoryRems)) return [''];
                else {
                    const categories = await _.asyncMap(categoryRems, async (categoryRem) => {
                        return _.split(
                            await Helpers.richTextToString(plugin, categoryRem?.backText),
                            ','
                        ).map(_.trim);
                    });
                    return _.uniq(_.flatten(categories));
                }
            }),
        };
    });

    const allCategories = _.uniq(products.flatMap(({ categories }) => categories));
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

    const flashcardRem = await Helpers.getRems(
        plugin,
        todaysRem,
        Helpers.includesStringInRem(REM_TEXT_TOTALS),
        Helpers.includesStringInRem(REM_TEXT_RITUALS),
        Helpers.includesStringInRem(REM_TEXT_FLASCARDS)
    ).then(_.first);
    if (_.isUndefined(flashcardRem)) return;

    const value = _.toNumber(await Helpers.richTextToString(plugin, flashcardRem.backText));
    await flashcardRem.setBackText([_.isNaN(value) ? '1' : _.toString(value + 1)]);
};

export const removeEmptyChildProperties = async (
    plugin: SDK.RNPlugin,
    rem: SDK.Rem
): Promise<void> => {
    const emptyPropertyRems = await Helpers.getRems(plugin, rem, async (plugin, rem) => {
        const referencedRem = await Helpers.getReferencedRemsFromRichText(plugin, rem.text).then(
            _.head
        );
        if (_.isUndefined(referencedRem)) return false;
        if (!(await referencedRem.isProperty())) return false;

        const backText = await Helpers.richTextToString(plugin, rem.backText);
        const value = backText.trim();

        if (value === 'No') return true;
        else if (_.isEmpty(value)) return true;
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

export const calculateAndSetQuota = async (
    plugin: SDK.RNPlugin,
    dailyRem: SDK.Rem
): Promise<void> => {
    const prevDailyRem = await Helpers.prevDailyDoc(plugin, dailyRem);
    if (_.isUndefined(prevDailyRem)) return void plugin.app.toast('Предыдущего дня не существует');

    const getQuotaRem = (rem: SDK.Rem) => {
        return Helpers.getRems(
            plugin,
            rem,
            Helpers.includesStringInRem(REM_TEXT_TOTALS),
            Helpers.includesStringInRem(REM_TEXT_OTHER),
            Helpers.includesStringInRem(REM_TEXT_QUOTA)
        ).then(_.head);
    };

    const prevQuotaRem = await getQuotaRem(prevDailyRem);
    const prevQuota = _.toNumber(await Helpers.richTextToString(plugin, prevQuotaRem?.backText));
    if (_.isNaN(prevQuota)) return void plugin.app.toast('Некорректный формат предыдущей квоты');

    const listPomodoros = await pomodoros(plugin, dailyRem);
    const [goodSumPom, badSumPom] = listPomodoros.reduce(
        ([goodSum, badSum], pomodoro) => {
            if (pomodoro.isBad) return [goodSum, badSum + pomodoro.value];
            else return [goodSum + pomodoro.value, badSum];
        },
        [0, 0] as [number, number]
    );

    const quota = Utils.roundToTens(goodSumPom / QUOTA_FACTOR - badSumPom + prevQuota);
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
        const productsRem = await Helpers.getRems(
            plugin,
            dailyRem,
            Helpers.includesStringInRem(REM_TEXT_PRODUCTS)
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
    const allProductRemsWithSearchPrefix = await Helpers.getRems(
        plugin,
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_PRODUCTS),
        Helpers.includesStringInRem('(+)')
    );

    await _.asyncMap(allProductRemsWithSearchPrefix, async (rem) => {
        return eraseSearchPrefix(plugin, rem);
    });

    const forPortalRem = await Helpers.getRems(
        plugin,
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_PRODUCTS),
        Helpers.includesStringInRem(REM_TEXT_FOR_PORTAL)
    ).then(_.head);
    await forPortalRem?.remove();
};

export const addPortalProduct = async (plugin: SDK.RNPlugin, dailyRem: SDK.Rem): Promise<void> => {
    const docName = await Helpers.richTextToString(plugin, dailyRem.text);
    const docDate = Utils.convertOrdinalDateToDate(docName);
    if (_.isUndefined(docDate)) return;

    const { toast } = plugin.app;
    const firstDayDate = new Date(docDate.getFullYear(), docDate.getMonth(), 1);
    const firstDayRem = await Helpers.getDailyDoc(plugin, firstDayDate);
    if (_.isUndefined(firstDayRem)) return void toast('Нет первого дня месяца');

    const forPortalRem = await _.block(async () => {
        const forPortalRem = await Helpers.getRems(
            plugin,
            firstDayRem,
            Helpers.includesStringInRem(REM_TEXT_PRODUCTS),
            Helpers.includesStringInRem(REM_TEXT_FOR_PORTAL)
        ).then(_.head);
        if (_.isNotUndefined(forPortalRem)) return forPortalRem;

        const prevFirstDayDate = new Date(docDate.getFullYear(), docDate.getMonth() - 1, 1);
        const prevFirstDayRem = await Helpers.getDailyDoc(plugin, prevFirstDayDate);
        if (_.isUndefined(prevFirstDayRem)) return void toast('Нет первого дня прошлого месяца');

        await collapseProductEnvironment(plugin, prevFirstDayRem);
        return await expandProductEnvironment(plugin, firstDayRem);
    });
    if (_.isUndefined(forPortalRem)) return void toast('Rem "Для портала" почему-то не создан');

    const newRem = await Helpers.getRems(
        plugin,
        dailyRem,
        Helpers.includesStringInRem(REM_TEXT_RATIONS),
        Helpers.includesStringInRem(REM_TEXT_NEW)
    ).then(_.head);
    if (_.isUndefined(newRem)) return void toast('Rem "Новое" не найден');

    const portal = await plugin.rem.createPortal();
    if (_.isUndefined(portal)) return void toast('Портал почему-то не создан');

    await portal?.setParent(newRem);
    await forPortalRem.addToPortal(portal);
};
