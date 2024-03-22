import * as SDK from '@remnote/plugin-sdk';
import * as App from '../App';
import { SymptomPanel } from '../components/SymptomPanel';
import { RegimePanel } from '../components/RegimePanel';
import { PomodoroPanel } from '../components/PomodoPanel';
import { RitualPanel } from '../components/RitualPanel';
import { RationPanel } from '../components/RationPanel';
import { NutritionPanel } from '../components/NutritionPanel';
import { MainPanel } from '../components/MainPanel';

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
    const panel = App.Hooks.usePanel();

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
                        onChange={(e) =>
                            panel.setSelectedPanel(e.currentTarget.value as App.PANELS)
                        }
                        value={panel.selectedPanel}
                        className="border text-sm rounded-lg p-2"
                    >
                        <option value={App.PANELS.MAIN}>{App.PANELS.MAIN}</option>
                        <option value={App.PANELS.REGIME}>{App.PANELS.REGIME}</option>
                        <option value={App.PANELS.RITUALS}>{App.PANELS.RITUALS}</option>
                        <option value={App.PANELS.SYMPTOMS}>{App.PANELS.SYMPTOMS}</option>
                        <option value={App.PANELS.POMODORO}>{App.PANELS.POMODORO}</option>
                        <option value={App.PANELS.NUTRITION}>{App.PANELS.NUTRITION}</option>
                        <option value={App.PANELS.RATIONS}>{App.PANELS.RATIONS}</option>
                    </select>
                </div>
            </form>

            <div className="mt-8">
                {panel.isSymptoms() ? (
                    <SymptomPanel dailyDocs={dailyDocs} />
                ) : panel.isRegime() ? (
                    <RegimePanel dailyDocs={dailyDocs} />
                ) : panel.isPomodoro() ? (
                    <PomodoroPanel dailyDocs={dailyDocs} />
                ) : panel.isRituals() ? (
                    <RitualPanel dailyDocs={dailyDocs} />
                ) : panel.isRations() ? (
                    <RationPanel dailyDocs={dailyDocs} />
                ) : panel.isNutrition() ? (
                    <NutritionPanel dailyDocs={dailyDocs} />
                ) : panel.isMain() ? (
                    <MainPanel dailyDocs={dailyDocs} />
                ) : null}
            </div>
        </div>
    );
}

SDK.renderWidget(Totals);
