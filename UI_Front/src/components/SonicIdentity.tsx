import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SonicIdentityProps {
  energy: number;
  danceability: number;
  length: number; // normalized 0-100
  variety: number; // derived from genres count
  mood: number; // derived from mood intensity
}

export const SonicIdentity = ({ energy, danceability, length, variety, mood }: SonicIdentityProps) => {
  const data = [
    { subject: 'Energy', A: energy, fullMark: 100 },
    { subject: 'Dance', A: danceability, fullMark: 100 },
    { subject: 'Length', A: length, fullMark: 100 },
    { subject: 'Variety', A: variety, fullMark: 100 },
    { subject: 'Vibe', A: mood, fullMark: 100 },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-white/10 h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-center text-muted-foreground uppercase tracking-widest">
          
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] -mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="My Mix"
              dataKey="A"
              stroke="#1DB954"
              strokeWidth={2}
              fill="#1DB954"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
