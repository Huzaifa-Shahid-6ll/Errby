"use client";

import { Component, createContext, useContext, useId } from "react";
import { z } from "zod/v3";
import {
  A2uiSurface,
  createComponentImplementation,
  type ReactComponentImplementation,
} from "@a2ui/react/v0_9";
import {
  Catalog,
  MessageProcessor,
  type ComponentApi,
  type SurfaceModel,
} from "@a2ui/web_core/v0_9";
import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { ArrowsOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowsOut";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/animate-ui/components/radix/dialog";
import {
  linearValue,
  visualSchema,
  type LinearVisual,
} from "@/lib/visuals/schema";
import "./chat-visual.css";

type VisualProps = {
  visual: LinearVisual;
  onChange: (visual: LinearVisual) => void;
  disabled?: boolean;
};

const ticks = [-10, -5, 0, 5, 10];
const coordinate = (value: number) => 40 + (value + 10) * 16;
const number = (value: number) => Number(value.toFixed(2)).toString();
const equation = (slope: number, intercept: number) =>
  `y ${Number(number(slope)) === slope && Number(number(intercept)) === intercept ? "=" : "≈"} ${number(slope)}x ${intercept < 0 ? "−" : "+"} ${number(Math.abs(intercept))}`;

const VisualContext = createContext<VisualProps | null>(null);
// Bind only data paths; this catalog does not accept executable A2UI function calls.
const dataPath = z.object({ path: z.string() });
const graphApi = {
  name: "LinearGraph",
  schema: z.object({
    title: z.union([z.string().max(100), dataPath]),
    caption: z.union([z.string().max(240), dataPath]),
    slope: z.union([z.number().min(-5).max(5), dataPath]),
    intercept: z.union([z.number().min(-10).max(10), dataPath]),
    comparisonEnabled: z.union([z.boolean(), dataPath]),
    comparisonSlope: z.union([z.number().min(-5).max(5), dataPath]),
    comparisonIntercept: z.union([z.number().min(-10).max(10), dataPath]),
  }),
};
const graphComponent = createComponentImplementation(
  // A2UI's recursive generic inference exceeds TS depth across Zod 3/4 packages.
  // Keep its runtime schema, and validate resolved props with our shared schema below.
  graphApi as unknown as ComponentApi,
  function BoundGraph({ props }) {
    const context = useContext(VisualContext);
    if (!context) return null;
    const parsed = visualSchema.safeParse({
      ...context.visual,
      title: props.title,
      caption: props.caption,
      slope: props.slope,
      intercept: props.intercept,
      comparison: props.comparisonEnabled
        ? { slope: props.comparisonSlope, intercept: props.comparisonIntercept }
        : null,
    });
    if (!parsed.success)
      return (
        <p role="status">
          This visual could not be displayed. Your chat is still available.
        </p>
      );
    return <GraphControls {...context} visual={parsed.data} />;
  },
);
// The catalog deliberately exposes one reviewed component and no remote content or actions.
const graphCatalog = new Catalog(
  "urn:errby:visuals:1",
  "v0.9",
  [graphComponent],
  [],
);

function graphData(visual: LinearVisual) {
  return {
    title: visual.title,
    caption: visual.caption,
    slope: visual.slope,
    intercept: visual.intercept,
    comparisonEnabled: visual.comparison !== null,
    comparisonSlope: visual.comparison?.slope ?? 0,
    comparisonIntercept: visual.comparison?.intercept ?? 0,
  };
}

class GraphSurface extends Component<
  VisualProps,
  {
    surface: SurfaceModel<ReactComponentImplementation> | null;
    failed: boolean;
  }
> {
  state = { surface: null, failed: false } as {
    surface: SurfaceModel<ReactComponentImplementation> | null;
    failed: boolean;
  };
  processor?: MessageProcessor<ReactComponentImplementation>;

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidMount() {
    try {
      const visual = visualSchema.parse(this.props.visual);
      this.processor = new MessageProcessor<ReactComponentImplementation>([
        graphCatalog,
      ]);
      this.processor.processMessages([
        {
          version: "v0.9",
          createSurface: { surfaceId: visual.id, catalogId: graphCatalog.id },
        },
        {
          version: "v0.9",
          updateDataModel: {
            surfaceId: visual.id,
            path: "/",
            value: graphData(visual),
          },
        },
        {
          version: "v0.9",
          updateComponents: {
            surfaceId: visual.id,
            components: [
              {
                id: "root",
                component: "LinearGraph",
                ...Object.fromEntries(
                  Object.keys(graphApi.schema.shape).map((key) => [
                    key,
                    { path: `/${key}` },
                  ]),
                ),
              },
            ],
          },
        },
      ]);
      const surface = this.processor.getSurface(visual.id);
      if (!surface) throw new Error("Visual surface unavailable");
      this.setState({ surface });
    } catch {
      this.setState({ failed: true });
    }
  }

  componentDidUpdate(previous: VisualProps) {
    if (previous.visual === this.props.visual || this.state.failed) return;
    try {
      const visual = visualSchema.parse(this.props.visual);
      this.processor?.processMessages({
        version: "v0.9",
        updateDataModel: {
          surfaceId: this.state.surface?.id ?? visual.id,
          path: "/",
          value: graphData(visual),
        },
      });
    } catch {
      this.setState({ failed: true });
    }
  }

  componentWillUnmount() {
    this.processor?.dispose();
  }

  render() {
    if (this.state.failed)
      return (
        <p role="status">
          This visual could not be displayed. Your chat and saved settings are
          still available.
        </p>
      );
    if (!this.state.surface)
      return <p role="status">Loading interactive graph…</p>;
    return (
      <VisualContext.Provider value={this.props}>
        <A2uiSurface surface={this.state.surface} />
      </VisualContext.Provider>
    );
  }
}

function GraphControls({ visual, onChange, disabled }: VisualProps) {
  const id = useId();
  const comparison = visual.comparison;
  return (
    <div className="chat-visual-body">
      <figure className="chat-visual-figure">
        <svg
          viewBox="0 0 400 400"
          role="img"
          aria-labelledby={`${id}-title ${id}-description`}
        >
          <title id={`${id}-title`}>{visual.title}</title>
          <desc id={`${id}-description`}>
            Solid line: {equation(visual.slope, visual.intercept)}.
            {comparison
              ? ` Dashed comparison: ${equation(comparison.slope, comparison.intercept)}.`
              : ""}
            Both axes show −10 to 10, with no units. Sample values are in the
            table below. Displayed numbers are rounded to two decimal places.
          </desc>
          <defs>
            <clipPath id={`${id}-plot`}>
              <rect x="40" y="40" width="320" height="320" />
            </clipPath>
          </defs>
          {ticks.map((tick) => (
            <g key={tick} className="chat-visual-grid">
              <line
                x1={coordinate(tick)}
                y1="40"
                x2={coordinate(tick)}
                y2="360"
              />
              <line
                x1="40"
                y1={coordinate(tick)}
                x2="360"
                y2={coordinate(tick)}
              />
              <text x={coordinate(tick)} y="384" textAnchor="middle">
                {tick}
              </text>
              <text x="31" y={coordinate(-tick) + 6} textAnchor="end">
                {tick}
              </text>
            </g>
          ))}
          <g className="chat-visual-axis">
            <line x1="40" y1="200" x2="360" y2="200" />
            <line x1="200" y1="40" x2="200" y2="360" />
            <text x="383" y="207">
              x
            </text>
            <text x="195" y="25">
              y
            </text>
          </g>
          <g clipPath={`url(#${id}-plot)`}>
            <line
              className="chat-visual-line"
              x1="40"
              y1={coordinate(-linearValue(visual.slope, visual.intercept, -10))}
              x2="360"
              y2={coordinate(-linearValue(visual.slope, visual.intercept, 10))}
            />
            {comparison && (
              <line
                className="chat-visual-line chat-visual-comparison"
                x1="40"
                y1={coordinate(
                  -linearValue(comparison.slope, comparison.intercept, -10),
                )}
                x2="360"
                y2={coordinate(
                  -linearValue(comparison.slope, comparison.intercept, 10),
                )}
              />
            )}
          </g>
        </svg>
        <figcaption className="chat-visual-equations">
          <span>Solid: {equation(visual.slope, visual.intercept)}</span>
          {comparison && (
            <span>
              Dashed: {equation(comparison.slope, comparison.intercept)}
            </span>
          )}
        </figcaption>
      </figure>
      <div className="chat-visual-controls">
        <p className="chat-visual-hint">
          Explore this example. Both axes are unitless.
        </p>
        {(["slope", "intercept"] as const).map((parameter) => (
          <div className="chat-visual-control" key={parameter}>
            <label htmlFor={`${id}-${parameter}`}>
              {parameter === "slope" ? "Slope (m)" : "Intercept (b)"}
              <output htmlFor={`${id}-${parameter}`}>
                {number(visual[parameter])}
              </output>
            </label>
            <input
              id={`${id}-${parameter}`}
              type="range"
              min={parameter === "slope" ? -5 : -10}
              max={parameter === "slope" ? 5 : 10}
              step="0.25"
              value={visual[parameter]}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...visual, [parameter]: Number(event.target.value) })
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onChange({ ...visual, slope: 1, intercept: 0 })}
        >
          Reset line to y = x
        </Button>
        <p className="chat-visual-hint">
          Use arrow keys to adjust a slider. Ask a follow-up in chat to change
          this figure.
        </p>
      </div>
      <details className="chat-visual-values">
        <summary>View values as a table</summary>
        <table>
          <caption>
            Sample values, rounded to two decimal places; includes values beyond
            the visible axes
          </caption>
          <thead>
            <tr>
              <th scope="col">x</th>
              <th scope="col">Solid y</th>
              {comparison && <th scope="col">Dashed y</th>}
            </tr>
          </thead>
          <tbody>
            {ticks.map((x) => (
              <tr key={x}>
                <th scope="row">{x}</th>
                <td>
                  {number(linearValue(visual.slope, visual.intercept, x))}
                </td>
                {comparison && (
                  <td>
                    {number(
                      linearValue(comparison.slope, comparison.intercept, x),
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export function ChatVisual(props: VisualProps) {
  const { visual } = props;
  const id = useId();
  return (
    <section
      className="chat-visual"
      aria-labelledby={`${id}-heading`}
      data-visual-id={visual.id}
      data-visual-revision={visual.revision}
    >
      <header className="chat-visual-header">
        <div>
          <span className="chat-visual-label">
            <ChartLineIcon size={20} weight="duotone" aria-hidden="true" />
            Interactive example
          </span>
          <h3 id={`${id}-heading`}>{visual.title}</h3>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              <ArrowsOutIcon aria-hidden="true" />
              Expand graph
            </Button>
          </DialogTrigger>
          <DialogContent className="chat-visual-dialog">
            <DialogHeader>
              <DialogTitle>{visual.title}</DialogTitle>
              <DialogDescription>{visual.caption}</DialogDescription>
            </DialogHeader>
            <GraphSurface {...props} />
          </DialogContent>
        </Dialog>
      </header>
      <p className="chat-visual-caption">{visual.caption}</p>
      <GraphSurface {...props} />
    </section>
  );
}
