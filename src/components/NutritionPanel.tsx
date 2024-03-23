import * as SDK from '@remnote/plugin-sdk';
import * as App from '../App';
import * as React from 'react';
import _ from 'lodash';
import { RichText } from './RichText';

interface NutritionPanelProps {
    readonly dailyDocs: App.DailyDoc[];
}

export function NutritionPanel({ dailyDocs }: NutritionPanelProps) {
    const plugin = SDK.usePlugin();
    const [selectedCategory, setSelectedCategory] = React.useState('-');

    const nutritionCategories =
        App.Hooks.useRunAsync(async () => {
            const allRations = _.flatten(
                await _.asyncMap(dailyDocs, async (dailyDoc) => {
                    return App.rations(plugin, dailyDoc.rem);
                })
            );
            return App.nutrition(plugin, allRations);
        }, [plugin, dailyDocs]) ?? [];

    React.useEffect(() => {
        setSelectedCategory(nutritionCategories.at(0)?.category ?? '-');
    }, [nutritionCategories]);

    const categories = nutritionCategories.map(({ category }, i) => {
        const name = _.isEmpty(category.trim()) ? 'Без категории' : category;
        const countProducts = nutritionCategories.at(i)?.products.length ?? 0;

        const isSelectedCategory = selectedCategory === category;
        const className = _.block(() => {
            const defaultClassName = 'font-medium cursor-pointer';
            if (isSelectedCategory) return defaultClassName + ' underline';
            else return defaultClassName;
        });
        const style = isSelectedCategory
            ? { textDecorationColor: 'blue', textUnderlineOffset: '8px' }
            : undefined;

        return (
            <span
                key={name}
                className={className}
                style={style}
                onClick={() => setSelectedCategory(category)}
            >
                {'🏷️ '}
                {name}
                {` – ${countProducts}`}
            </span>
        );
    });

    const products = _.map(
        _.sortBy(
            _.find(nutritionCategories, { category: selectedCategory })?.products ?? [],
            ({ foods }) => foods.length
        ).reverse(),
        (product) => {
            const totals = product.totals.map(({ eaten, unit }, i) => {
                const isLast = i === product.totals.length - 1;
                return (
                    <span key={unit}>
                        <span
                            className="font-bold underline underline-offset-4"
                            style={{ textDecorationColor: 'orange' }}
                        >
                            {eaten}
                        </span>
                        <span style={{ opacity: '.75' }}> {unit}</span>
                        {isLast ? null : <span> / </span>}
                    </span>
                );
            });
            return (
                <div className="flex items-center gap-3" key={product.rem._id}>
                    <span
                        className="flex-none flex justify-center items-center h-8 w-8 border-px border-solid rounded-full font-bold"
                        style={{ borderColor: 'var(--text-color-green)' }}
                    >
                        {product.foods.length}
                    </span>
                    <div>
                        <span className="font-semibold">
                            <RichText richText={product.rem.text} defaultValue="-" />
                        </span>
                        <span> — </span>
                        <span className="italic" style={{ letterSpacing: '0.025em' }}>
                            {totals}
                        </span>
                    </div>
                </div>
            );
        }
    );

    return (
        <div>
            <div className="flex flex-wrap gap-4">{categories}</div>
            <div className="grid gap-3 mt-10 px-2">{products}</div>
        </div>
    );
}
