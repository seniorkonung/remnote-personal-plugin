import * as SDK from '@remnote/plugin-sdk';
import * as App from '../App';
import { SymptomPanel } from '../components/SymptomPanel';
import { RegimePanel } from '../components/RegimePanel';
import { PomodoroPanel } from '../components/PomodoPanel';
import { RitualPanel } from '../components/RitualPanel';
import { RationPanel } from '../components/RationPanel';

function Totals() {
    const plugin = SDK.usePlugin();
    const {
        selectedYear,
        selectedMonth,
        selectedSprint,
        setSelectedYear,
        setSelectedMonth,
        setSelectedSprint,
    } = App.Hooks.useDateFilter();
    const type = App.Hooks.useFilterType();

    const dailyDocs =
        App.Hooks.useRunAsync(async () => {
            return App.dailyDocs(plugin, selectedYear, selectedMonth, selectedSprint);
        }, [plugin, selectedYear, selectedMonth, selectedSprint]) ?? [];

    return (
        <div className="px-2">
            <form className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex flex-col gap-y-2">
                    <label htmlFor="years" className="text-sm font-medium">
                        Год
                    </label>
                    <select
                        id="years"
                        onChange={(e) => setSelectedYear(+e.currentTarget.value)}
                        value={selectedYear}
                        className="border text-sm rounded-lg p-2"
                    >
                        {App.years().map((year) => {
                            return (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div className="flex flex-col gap-y-2">
                    <label htmlFor="months" className="text-sm font-medium">
                        Месяц
                    </label>
                    <select
                        id="months"
                        onChange={(e) => setSelectedMonth(e.currentTarget.value)}
                        value={selectedMonth}
                        className="border text-sm rounded-lg p-2"
                    >
                        {App.months(selectedYear).map((month) => {
                            return (
                                <option key={month} value={month}>
                                    {month}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div className="flex flex-col gap-y-2">
                    <label htmlFor="sprints" className="text-sm font-medium">
                        Спринт
                    </label>
                    <select
                        id="sprints"
                        onChange={(e) => setSelectedSprint(e.currentTarget.value)}
                        value={selectedSprint}
                        className="border text-sm rounded-lg p-2"
                    >
                        {App.sprints(selectedYear, selectedMonth).map((sprint) => {
                            return (
                                <option key={sprint} value={sprint}>
                                    {sprint}
                                </option>
                            );
                        })}
                    </select>
                </div>

                <div className="flex flex-col gap-y-2">
                    <label htmlFor="types" className="text-sm font-medium">
                        Режим
                    </label>
                    <select
                        id="types"
                        onChange={(e) => type.setSelectedType(e.currentTarget.value as App.TYPES)}
                        value={type.selectedType}
                        className="border text-sm rounded-lg p-2"
                    >
                        <option value={App.TYPES.MAIN}>{App.TYPES.MAIN}</option>
                        <option value={App.TYPES.NUTRITION}>{App.TYPES.NUTRITION}</option>
                        <option value={App.TYPES.POMODORO}>{App.TYPES.POMODORO}</option>
                        <option value={App.TYPES.RATIONS}>{App.TYPES.RATIONS}</option>
                        <option value={App.TYPES.SYMPTOMS}>{App.TYPES.SYMPTOMS}</option>
                        <option value={App.TYPES.REGIME}>{App.TYPES.REGIME}</option>
                        <option value={App.TYPES.RITUALS}>{App.TYPES.RITUALS}</option>
                        <option value={App.TYPES.OTHER}>{App.TYPES.OTHER}</option>
                    </select>
                </div>
            </form>

            <div className="mt-8">
                {type.isSymptoms() ? (
                    <SymptomPanel dailyDocs={dailyDocs} />
                ) : type.isRegime() ? (
                    <RegimePanel dailyDocs={dailyDocs} />
                ) : type.isPomodoro() ? (
                    <PomodoroPanel dailyDocs={dailyDocs} />
                ) : type.isRituals() ? (
                    <RitualPanel dailyDocs={dailyDocs} />
                ) : type.isRations() ? (
                    <RationPanel dailyDocs={dailyDocs} />
                ) : null}
            </div>
        </div>
    );
}

SDK.renderWidget(Totals);
