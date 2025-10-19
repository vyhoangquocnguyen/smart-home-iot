import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const Charts = ({ data }) => {
  const formattedData = data.map((d) => ({
    temperature: d.temperature,
    humidity: d.humidity,
    time: new Date(d.timestamp).toLocaleTimeString(),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="temperature" stroke="#ff7300" />
        <Line type="monotone" dataKey="humidity" stroke="#387908" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Charts;
