"use client";

import { useEffect, useState } from "react";

export default function DateAndTime() {
  const [timeParts, setTimeParts] = useState({
    h: "00",
    m: "00",
    s: "00",
    period: "AM",
  });

  useEffect(() => {
    function updateTime() {
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true, // enable AM/PM
      };
      const formatter = new Intl.DateTimeFormat("en-GB", options);
      const formatted = formatter.format(date); // e.g., "01:23:45 p.m."

      const [time, periodRaw] = formatted.split(" ");
      const [h, m, s] = time.split(":");
      const period = periodRaw.toUpperCase(); // AM or PM

      setTimeParts({ h, m, s, period });
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center items-center space-x-2.5">
      <div className=" text-gray-500 text-xs">UK Current Time:</div>
      <div className="flex items-center gap-2">
        {/* Hours */}
        <div className="bg-white ring-1 ring-gray-300 rounded-md w-8 h-8 flex justify-center items-center text-md font-medium shadow-sm">
          {timeParts.h}
        </div>

        {/* Minutes */}
        <div className="bg-white ring-1 ring-gray-300 rounded-md w-8 h-8 flex justify-center items-center text-md font-medium shadow-sm">
          {timeParts.m}
        </div>

        {/* Seconds */}
        <div className="bg-white ring-1 ring-gray-300 rounded-md w-8 h-8 flex justify-center items-center text-md font-medium shadow-sm">
          {timeParts.s}
        </div>

        {/* AM/PM */}
        <div className="bg-white ring-1 ring-gray-300 rounded-md w-8 h-8 flex justify-center items-center text-xs font-medium shadow-sm">
          {timeParts.period}
        </div>
      </div>
    </div>
  );
}
