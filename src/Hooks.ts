import * as App from './App';
import * as SDK from '@remnote/plugin-sdk';
import React from 'react';

export function useRunAsync<T>(fn: () => Promise<T>, deps: any[]): T | undefined {
    const [promise, setPromise] = React.useState<Promise<T>>();
    React.useEffect(() => setPromise(fn()), deps);

    const [value, setValue] = React.useState<T>();
    React.useEffect(() => {
        let isMounted = true;
        promise?.then((v) => {
            if (isMounted) setValue(v);
        });
        return () => {
            isMounted = false;
        };
    }, [promise]);

    return value;
}

export function useDateFilter() {
    const [selectedYear, setSelectedYear] = SDK.useSessionStorageState(
        'selected_year',
        App.years()[0]
    );
    const [selectedMonth, setSelectedMonth] = SDK.useSessionStorageState(
        'selected_month',
        App.months(selectedYear)[0]
    );
    const [selectedSprint, setSelectedSprint] = SDK.useSessionStorageState(
        'selected_sprint',
        App.sprints(selectedYear, selectedMonth)[0]
    );
    return {
        selectedYear,
        selectedMonth,
        selectedSprint,
        setSelectedYear(year: number) {
            const month = App.months(year)[0];
            const sprint = App.sprints(year, month)[0];
            setSelectedYear(year);
            setSelectedMonth(month);
            setSelectedSprint(sprint);
        },
        setSelectedMonth(month: string) {
            const year = selectedYear;
            const sprint = App.sprints(year, month)[0];
            setSelectedMonth(month);
            setSelectedSprint(sprint);
        },
        setSelectedSprint,
    };
}

export function usePanel() {
    const [selectedPanel, setSelectedPanel] = SDK.useSessionStorageState(
        'selected_type',
        App.PANELS.MAIN
    );
    return {
        isMain: () => selectedPanel === App.PANELS.MAIN,
        isNutrition: () => selectedPanel === App.PANELS.NUTRITION,
        isPomodoro: () => selectedPanel === App.PANELS.POMODORO,
        isRations: () => selectedPanel === App.PANELS.RATIONS,
        isSymptoms: () => selectedPanel === App.PANELS.SYMPTOMS,
        isRegime: () => selectedPanel === App.PANELS.REGIME,
        isRituals: () => selectedPanel === App.PANELS.RITUALS,
        selectedPanel,
        setSelectedPanel,
    };
}
