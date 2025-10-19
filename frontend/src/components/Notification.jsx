
const Notification = ({ temperature, humidity }) => {
  const t = temperature !== null ? Number(temperature) : null;
  const h = humidity !== null ? Number(humidity) : null;
  if ((t === null || t < 30) && (h === null || h < 70)) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-900 p-2 rounded mt-2 shadow-sm">
      <strong className="mr-2">⚠️ Alert</strong>
      <span className="text-sm">
        {t !== null && t > 30 && `High temperature: ${t}°C`}
        {t !== null && t > 30 && h !== null && h > 70 && ` · `}
        {h !== null && h > 70 && `High humidity: ${h}%`}
      </span>
    </div>
  );
};

export default Notification;
