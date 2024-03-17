import * as SDK from '@remnote/plugin-sdk'
import * as App from '../App'
import * as React from 'react';
import { SymptomPanel } from '../components/SymptomPanel'
import { RegimePanel } from '../components/RegimePanel'

function useDateFilter() {
    const [selectedYear, setSelectedYear] = React.useState(() => App.years()[0])
    const [selectedMonth, setSelectedMonth] = React.useState(() => App.months(selectedYear)[0])
    const [selectedSprint, setSelectedSprint] = React.useState(() => App.sprints(selectedYear, selectedMonth)[0])
    return {
        selectedYear,
        selectedMonth,
        selectedSprint,
        setSelectedYear(year: number) {
            const month = App.months(year)[0]
            const sprint = App.sprints(year, month)[0]
            setSelectedYear(year)
            setSelectedMonth(month)
            setSelectedSprint(sprint)
        },
        setSelectedMonth(month: string) {
            const year = selectedYear
            const sprint = App.sprints(year, month)[0]
            setSelectedMonth(month)
            setSelectedSprint(sprint)
        },
        setSelectedSprint
    }
}

function useFilterType() {
    const [selectedType, setSelectedType] = React.useState(App.TYPES.MAIN)
    return {
        isMain: () => selectedType === App.TYPES.MAIN,
        isNutrition: () => selectedType === App.TYPES.NUTRITION,
        isPomodoro: () => selectedType === App.TYPES.POMODORO,
        isRations: () => selectedType === App.TYPES.RATIONS,
        isSymptoms: () => selectedType === App.TYPES.SYMPTOMS,
        isRegime: () => selectedType === App.TYPES.REGIME,
        isRituals: () => selectedType === App.TYPES.RITUALS,
        isOther: () => selectedType === App.TYPES.OTHER,
        selectedType,
        setSelectedType
    }
}

function Totals() {
    const plugin = SDK.usePlugin()
    const { 
        selectedYear, selectedMonth, selectedSprint,
        setSelectedYear, setSelectedMonth, setSelectedSprint
    } = useDateFilter()
    const type = useFilterType()

    const dailyDocs = SDK.useRunAsync(async () => {
        return App.dailyDocs(plugin, selectedYear, selectedMonth, selectedSprint)
    }, [selectedYear, selectedMonth, selectedSprint]) ?? []

    if (type.isPomodoro()) {
        Promise.all(dailyDocs.map((d) => App.pomodoros(plugin, d.rem))).then((pomodoros) => {
            App.log(pomodoros)
            App.log(App.calculateTotalPomodoros(pomodoros))
        })
    }

    if (type.isRituals()) {
        Promise.all(dailyDocs.map((d) => App.rituals(plugin, d.rem))).then((dailyRituals) => {
            App.log(dailyRituals)
            dailyRituals.forEach((rituals) => {
                rituals.forEach(({ name, value }) => {
                    App.log(name, ' ++++++++ ', value)
                })
            })
        })
    }

    if (type.isOther()) {
        Promise.all(dailyDocs.map((d) => App.others(plugin, d.rem))).then((others) => {
            App.log(others)
        })
    }

    if (type.isMain()) {
        dailyDocs.map(async (d) => {
            // App.log(d.name)
            // App.log('Версия: ', App.version(d.name))
            // App.log('До конца месяца: ', App.daysUntilEndOfMonth(d.name))
            // App.log('Квота: ', await App.quota(plugin, d.rem))
            // App.log('Количество заметок: ', await App.notesCount(plugin, d.rem))
            App.log('Тезисы: ', await App.theses(plugin, d.rem))
        })
    }

    if (type.isRations()) {
        dailyDocs.map(async (d) => {
            App.log(await App.rations(plugin, d.rem))
        })
    }

    if (type.isNutrition()) {
        dailyDocs.map(async (d) => {
            App.nutrition(plugin, await App.rations(plugin, d.rem)).then(App.log)
        })
    }

    return (
        <div className="overflow-y-scroll" style={{height: '900px'}}>
            <select onChange={e => setSelectedYear(+e.currentTarget.value)} value={selectedYear}>
                {App.years().map(year => { 
                    return <option key={year} value={year}>{year}</option>
                })}
            </select>
            <select onChange={e => setSelectedMonth(e.currentTarget.value)} value={selectedMonth}>
                {App.months(selectedYear).map(month => { 
                    return <option key={month} value={month}>{month}</option>
                })}
            </select>
            <select onChange={e => setSelectedSprint(e.currentTarget.value)} value={selectedSprint}>
                {App.sprints(selectedYear, selectedMonth).map(sprint => { 
                    return <option key={sprint} value={sprint}>{sprint}</option>
                })}
            </select>
            <select onChange={e => type.setSelectedType(e.currentTarget.value as App.TYPES)} value={type.selectedType}>
                <option value={App.TYPES.MAIN}>{App.TYPES.MAIN}</option>
                <option value={App.TYPES.NUTRITION}>{App.TYPES.NUTRITION}</option>
                <option value={App.TYPES.POMODORO}>{App.TYPES.POMODORO}</option>
                <option value={App.TYPES.RATIONS}>{App.TYPES.RATIONS}</option>
                <option value={App.TYPES.SYMPTOMS}>{App.TYPES.SYMPTOMS}</option>
                <option value={App.TYPES.REGIME}>{App.TYPES.REGIME}</option>
                <option value={App.TYPES.RITUALS}>{App.TYPES.RITUALS}</option>
                <option value={App.TYPES.OTHER}>{App.TYPES.OTHER}</option>
            </select>

            <div>
                {type.isSymptoms() && <SymptomPanel dailyDocs={dailyDocs} />}
                {type.isRegime() && <RegimePanel dailyDocs={dailyDocs} />}
            </div>
        </div>
    )
}

SDK.renderWidget(Totals)
