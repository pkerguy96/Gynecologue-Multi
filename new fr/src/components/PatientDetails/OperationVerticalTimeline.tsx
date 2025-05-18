/* import {
  VerticalTimeline,
  VerticalTimelineElement,
  //@ts-ignore
} from "react-vertical-timeline-component";
import { Operation } from "../../services/OperationService";

import VaccinesOutlinedIcon from "@mui/icons-material/VaccinesOutlined";
import LoadingSpinner from "../LoadingSpinner";
import { useMemo } from "react";

import { Box } from "@mui/material";

interface OperationVerticalTimelineProps {
  Operations: Operation[];
  isLoading: boolean;
}

const OperationVerticalTimeline = ({
  Operations,
  isLoading,
}: OperationVerticalTimelineProps) => {
  if (isLoading) return <LoadingSpinner />;
  const Operationtimeline = useMemo(
    () => (
      <Box className="max-h-[500px] overflow-auto rounded-md bg-[#f5f5f5] p-4">
        <VerticalTimeline className="!w-full !m-0">
          {Operations.map((operation: Operation) =>
            operation.operation_type.map(
              (operation_type: any, index: number) => (
                <VerticalTimelineElement
                  key={index}
                  className="vertical-timeline-element--work"
                  date={operation_type.date}
                  contentStyle={{
                    borderTop: "3px solid #76c5bf",
                  }}
                  dateClassName="custom-date-color !py-0 lg:!py-[.7rem]"
                  contentArrowStyle={{
                    borderRight: "8px solid  #76c5bf",
                  }}
                  iconStyle={{ background: "#76c5bf", color: "#fff" }}
                  icon={<VaccinesOutlinedIcon />}
                >
                  <div key={index} className="flex flex-col">
                    <div className="flex gap-1">
                      <h6>{index + 1}.</h6>
                      <h4 className="vertical-timeline-element-subtitle">
                        {operation_type.operation_type}
                      </h4>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <div className="flex gap-1">
                        <h6>Source:</h6>
                        <span>{operation_type.source}</span>
                      </div>
                      <div className="flex gap-1">
                        <h6>Prix:</h6>
                        <span>{operation_type.price} MAD</span>
                      </div>
                    </div>
                  </div>
                </VerticalTimelineElement>
              )
            )
          )}
        </VerticalTimeline>
      </Box>
    ),
    [Operations]
  );
  return Operationtimeline;
};
export default OperationVerticalTimeline;
 */

import { useState } from "react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import { Operation } from "../../services/OperationService";
import VaccinesOutlinedIcon from "@mui/icons-material/VaccinesOutlined";
import LoadingSpinner from "../LoadingSpinner";
import { Box } from "@mui/material";
import OpenInFullOutlinedIcon from "@mui/icons-material/OpenInFullOutlined";
import OperationDetailsComponent from "../OperationDetailsComponent";

interface OperationVerticalTimelineProps {
  Operations: Operation[];
  isLoading: boolean;
}

const OperationVerticalTimeline = ({
  Operations,
  isLoading,
}: OperationVerticalTimelineProps) => {
  const [open, setOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(
    null
  );

  const handleOpen = (operation: Operation) => {
    setSelectedOperation(operation);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedOperation(null);
  };
  console.log(Operations);

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <Box className="max-h-[500px] overflow-auto rounded-md bg-[#f5f5f5] p-4">
        <VerticalTimeline className="!w-full !m-0">
          {Operations.map((operation: Operation, index) => (
            <VerticalTimelineElement
              key={operation.id}
              className="vertical-timeline-element--work"
              date={operation.date}
              contentStyle={{ borderTop: "3px solid #76c5bf" }}
              dateClassName="custom-date-color !py-0 lg:!py-[.7rem]"
              contentArrowStyle={{ borderRight: "8px solid  #76c5bf" }}
              iconStyle={{ background: "#76c5bf", color: "#fff" }}
              icon={<VaccinesOutlinedIcon />}
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 flex gap-2 text-sm">
                  <div className="flex gap-1">
                    <h6>Note:</h6>
                    <span>{operation.note}</span>
                  </div>
                  <div className="flex gap-1">
                    <h6>Prix:</h6>
                    <span>{operation.total_cost} MAD</span>
                  </div>
                </div>
                <div
                  onClick={() => handleOpen(operation.id)}
                  className="w-7 h-7 flex p-2 cursor-pointer text-white items-center justify-center rounded-full ms-auto bg-[#76c5bf]"
                >
                  <OpenInFullOutlinedIcon color="inherit" fontSize="small" />
                </div>
              </div>
            </VerticalTimelineElement>
          ))}
        </VerticalTimeline>
      </Box>

      {open && selectedOperation && (
        <OperationDetailsComponent
          onClose={handleClose}
          open={open}
          operation={selectedOperation}
        />
      )}
    </>
  );
};

export default OperationVerticalTimeline;
