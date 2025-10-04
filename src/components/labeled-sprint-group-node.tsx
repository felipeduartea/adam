import { memo } from "react";
import SprintNode from "./sprint-node";
import GroupNode from "./group-node";

const LabeledSprintGroupNode = memo(({ id, data, xPos, yPos, width, height, ...rest }: any) => {
  return (
    <GroupNode
      id={id}
      data={data}
      x={xPos}
      y={yPos}
      width={width}
      height={height}
      className="rounded-xl border-2 border-primary/30 bg-card/50 backdrop-blur-sm shadow-xl"
      label={data.label}
      labelStyle={{ fontSize: '1.25rem', fontWeight: 'bold', fill: 'currentColor' }}
      // You might need to adjust the label position based on your design
      // labelPosition="top"
      {...rest}
    >
      {/* Render the actual SprintNode content inside the GroupNode */}
      <SprintNode data={data} />
    </GroupNode>
  );
});

export default LabeledSprintGroupNode;

