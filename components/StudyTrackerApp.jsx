import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import { Calendar } from "./ui/calendar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Tooltip, Legend, Filler);

const subjects = [
  { name: "Mathematics", chapters: 20 },
  { name: "Physics", chapters: 20 },
  { name: "Fluid Mechanics", chapters: 20 },
  { name: "Materials Science", chapters: 20 },
  { name: "Thermodynamics", chapters: 20 },
];

const startDate = new Date("2025-04-22");
const originalEndDate = new Date("2025-05-19");
const dayDiff = (start, end) => Math.floor((end - start) / (1000 * 60 * 60 * 24));
const daysBetween = dayDiff(startDate, originalEndDate) + 1;
const totalChapters = subjects.reduce((sum, s) => sum + s.chapters, 0);
const requiredChaptersPerDay = Math.ceil(totalChapters / daysBetween);

export default function StudyTrackerApp() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem("study-progress");
    if (saved) return JSON.parse(saved);
    return subjects.reduce((acc, subj) => {
      acc[subj.name] = {};
      for (let i = 1; i <= subj.chapters; i++) {
        acc[subj.name][i] = { reading: false, past: false, review: false, date: null };
      }
      return acc;
    }, {});
  });

  const [percent, setPercent] = useState(0);
  const [dailyBehind, setDailyBehind] = useState([]);
  const [pastDueTasks, setPastDueTasks] = useState([]);
  const [predictedEndDate, setPredictedEndDate] = useState(originalEndDate);
  const [dailyRates, setDailyRates] = useState([]);

  useEffect(() => {
    localStorage.setItem("study-progress", JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    let completed = 0;
    let total = 0;
    const dailyMissed = [];
    const missedSet = new Set();
    const dayCompleted = {};
    const now = new Date();
    const nowIndex = dayDiff(startDate, now);

    const chapterAssignments = [];
    let subjectChapterPointers = subjects.map(() => 1);
    let count = 0;
    while (count < totalChapters) {
      for (let s = 0; s < subjects.length && count < totalChapters; s++) {
        const chapter = subjectChapterPointers[s];
        if (chapter <= subjects[s].chapters) {
          chapterAssignments.push({ name: subjects[s].name, chapter });
          subjectChapterPointers[s]++;
          count++;
        }
      }
    }

    const dailyAssignments = chapterAssignments.map((item, index) => {
      const day = Math.floor(index / requiredChaptersPerDay);
      return { ...item, day };
    });

    const currentIndex = dayDiff(startDate, selectedDate);
    const todayAssignments = dailyAssignments.filter(a => a.day === currentIndex);

    for (const subj of subjects) {
      for (let i = 1; i <= subj.chapters; i++) {
        const state = progress[subj.name][i];
        if (!state) continue;
        total += 3;
        const comp = [state.reading, state.past, state.review].filter(Boolean).length;
        completed += comp;

        const chapterDay = dailyAssignments.find(c => c.name === subj.name && c.chapter === i)?.day;

        if (chapterDay === currentIndex && comp < 3) {
          dailyMissed.push(`${subj.name} ${i}`);
        }
        if (chapterDay < nowIndex && comp < 3) {
          missedSet.add(`${subj.name} ${i}`);
        }
        if (chapterDay !== undefined) {
          if (!dayCompleted[chapterDay]) dayCompleted[chapterDay] = 0;
          dayCompleted[chapterDay] += comp;
        }
      }
    }

    const unfinishedBeforeNow = Array.from(missedSet).length > 0;
    const remaining = total - completed;

    if (unfinishedBeforeNow || completed < total) {
      const actualDaysStudied = new Set();
      for (const subj of subjects) {
        for (let i = 1; i <= subj.chapters; i++) {
          const state = progress[subj.name][i];
          if (state?.reading || state?.past || state?.review) {
            const dateKey = new Date(state.date).toDateString();
            actualDaysStudied.add(dateKey);
          }
        }
      }

      const daysUsed = actualDaysStudied.size || 1;
      const dailyActual = completed / daysUsed;
      const predictedDays = Math.ceil(remaining / dailyActual);

      const newEnd = new Date();
      newEnd.setDate(newEnd.getDate() + predictedDays);
      setPredictedEndDate(newEnd);
    } else {
      setPredictedEndDate(originalEndDate);
    }

    setDailyRates(
      Object.entries(dayCompleted).map(([k, v]) => ({ x: new Date(startDate.getTime() + k * 86400000), y: v }))
    );
    setPercent((completed / total) * 100);
    setDailyBehind(dailyMissed);
    setPastDueTasks(Array.from(missedSet));
  }, [progress, selectedDate]);

  const currentIndex = dayDiff(startDate, selectedDate);
  const chapterAssignments = [];
  let subjectChapterPointers = subjects.map(() => 1);
  let count = 0;
  while (count < totalChapters) {
    for (let s = 0; s < subjects.length && count < totalChapters; s++) {
      const chapter = subjectChapterPointers[s];
      if (chapter <= subjects[s].chapters) {
        chapterAssignments.push({ name: subjects[s].name, chapter });
        subjectChapterPointers[s]++;
        count++;
      }
    }
  }

  const todayAssignments = chapterAssignments
    .map((item, index) => ({ ...item, day: Math.floor(index / requiredChaptersPerDay) }))
    .filter(item => item.day === currentIndex);

    const toggle = (subject, chapter, type) => {
      console.log("Toggled:", subject, chapter, type);
      setProgress(prev => {
        const updated = JSON.parse(JSON.stringify(prev)); // ⛑️ 深拷贝
        updated[subject][chapter][type] = !updated[subject][chapter][type];
        updated[subject][chapter].date = new Date();
        return updated;
      });
    };
    
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Study Tracker App</h1>
      <div className="mb-6">
        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border w-fit" />
      </div>
      <div className="text-gray-600 mb-2">
        {selectedDate.toDateString()}（预计完成日期：{predictedEndDate.toDateString()}）
      </div>
      <div className="mb-4">
        <Progress value={percent} className="h-3" />
        <p className="text-sm text-gray-600 mt-1">总体完成进度：{percent.toFixed(1)}%</p>
        {dailyBehind.length > 0 && (
          <div className="text-red-500 text-sm mt-1">
            今日未完成任务：{dailyBehind.join('、')}。
          </div>
        )}
        {pastDueTasks.length > 0 && (
          <div className="text-orange-500 text-sm mt-1">
            过去未完成任务：{pastDueTasks.join('、')}。
          </div>
        )}
      </div>
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-2">每周学习效率趋势</h2>
          <Line
            data={{
              datasets: [
                {
                  label: '每日完成项数',
                  data: dailyRates,
                  borderColor: '#3b82f6',
                  tension: 0.3,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: { type: 'time', title: { display: true, text: '日期' } },
                y: { beginAtZero: true, title: { display: true, text: '完成项数' } },
              },
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-sm text-gray-600">
                <th>Subject</th>
                <th>Chapter</th>
                <th>Reading</th>
                <th>Past Papers</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {todayAssignments.map(({ name, chapter }) => (
                <tr key={name + chapter} className="text-sm">
                  <td>{name}</td>
                  <td>{chapter}</td>
                  <td><Checkbox checked={progress[name][chapter]?.reading} onCheckedChange={() => toggle(name, chapter, 'reading')} /></td>
                  <td><Checkbox checked={progress[name][chapter]?.past} onCheckedChange={() => toggle(name, chapter, 'past')} /></td>
                  <td><Checkbox checked={progress[name][chapter]?.review} onCheckedChange={() => toggle(name, chapter, 'review')} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}