import { Badge } from "@/frontend/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";

type MetricsBoardProps = {
  metrics: {
    searchCount: number;
    zeroResultCount: number;
    sessionCount: number;
    clickCount: number;
    zeroResultRate: number;
    topQueries: Array<{ query: string; count: number }>;
    searchesByDay: Array<{ day: string; count: number }>;
  };
};

export function MetricsBoard({ metrics }: MetricsBoardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard title="Buscas" value={metrics.searchCount} />
      <MetricCard title="Conversas" value={metrics.sessionCount} />
      <MetricCard title="Cliques em produto" value={metrics.clickCount} />
      <MetricCard
        title="Sem resultado"
        value={`${Math.round(metrics.zeroResultRate * 100)}%`}
      />
      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Termos mais buscados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {metrics.topQueries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem buscas ainda.</p>
          ) : (
            metrics.topQueries.map((row) => (
              <Badge key={row.query} variant="secondary">
                {row.query} ({row.count})
              </Badge>
            ))
          )}
        </CardContent>
      </Card>
      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Buscas por dia (30 dias)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.searchesByDay.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados no período.</p>
          ) : (
            metrics.searchesByDay.map((row) => (
              <div
                key={row.day}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{row.day}</span>
                <span className="font-medium">{row.count}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
