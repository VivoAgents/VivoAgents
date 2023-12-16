import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Modal, message } from "antd";
import * as React from "react";
import { IFlowConfig, IStatus } from "../../types";
import { appContext } from "../../../hooks/provider";
import {
  fetchJSON,
  getServerUrl,
  sampleWorkflowConfig,
  timeAgo,
  truncateText,
} from "../../utils";
import { Card, FlowConfigViewer, LaunchButton } from "../../atoms";

const WorkflowView = ({}: any) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<IStatus | null>({
    status: true,
    message: "All good",
  });
  const { user } = React.useContext(appContext);
  const serverUrl = getServerUrl();
  const listWorkflowsUrl = `${serverUrl}/workflows?user_id=${user?.email}`;
  const saveWorkflowsUrl = `${serverUrl}/workflows/`;

  const [workflows, setWorkflows] = React.useState<IFlowConfig[] | null>([]);
  const [selectedWorkflow, setSelectedWorkflow] =
    React.useState<IFlowConfig | null>(null);

  const defaultConfig = sampleWorkflowConfig();
  const [newWorkflow, setNewWorkflow] = React.useState<IFlowConfig | null>(
    defaultConfig
  );

  const [showWorkflowModal, setShowWorkflowModal] = React.useState(false);
  const [showNewWorkflowModal, setShowNewWorkflowModal] = React.useState(false);

  const fetchWorkFlow = () => {
    setError(null);
    setLoading(true);
    // const fetch;
    const payLoad = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const onSuccess = (data: any) => {
      if (data && data.status) {
        message.success(data.message);
        console.log("workflows", data.data);
        setWorkflows(data.data);
      } else {
        message.error(data.message);
      }
      setLoading(false);
    };
    const onError = (err: any) => {
      setError(err);
      message.error(err.message);
      setLoading(false);
    };
    fetchJSON(listWorkflowsUrl, payLoad, onSuccess, onError);
  };

  const saveWorkFlow = (workflow: IFlowConfig) => {
    setError(null);
    setLoading(true);
    // const fetch;
    const payLoad = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user?.email,
        workflow: workflow,
      }),
    };

    const onSuccess = (data: any) => {
      if (data && data.status) {
        message.success(data.message);
        // console.log("workflows", data.data);
        setWorkflows(data.data);
      } else {
        message.error(data.message);
      }
      setLoading(false);
    };
    const onError = (err: any) => {
      setError(err);
      message.error(err.message);
      setLoading(false);
    };
    fetchJSON(saveWorkflowsUrl, payLoad, onSuccess, onError);
  };

  React.useEffect(() => {
    if (user) {
      // console.log("fetching messages", messages);
      fetchWorkFlow();
    }
  }, []);

  React.useEffect(() => {
    if (selectedWorkflow) {
      setShowWorkflowModal(true);
    }
  }, [selectedWorkflow]);

  const workflowRows = (workflows || []).map(
    (workflow: IFlowConfig, i: number) => {
      return (
        <div key={"workflowrow" + i} className=" " style={{ width: "200px" }}>
          <Card
            className="h-full p-2 cursor-pointer"
            title={workflow.name}
            onClick={() => {
              setSelectedWorkflow(workflow);
            }}
          >
            <div className="my-2"> {truncateText(workflow.name, 70)}</div>
            <div className="text-xs">{timeAgo(workflow.timestamp || "")}</div>
          </Card>
        </div>
      );
    }
  );

  const WorkflowModal = ({
    workflow,
    setWorkflow,
    showWorkflowModal,
    setShowWorkflowModal,
    handler,
  }: {
    workflow: IFlowConfig | null;
    setWorkflow: (workflow: IFlowConfig | null) => void;
    showWorkflowModal: boolean;
    setShowWorkflowModal: (show: boolean) => void;
    handler?: (workflow: IFlowConfig) => void;
  }) => {
    const [localWorkflow, setLocalWorkflow] =
      React.useState<IFlowConfig | null>(workflow);

    return (
      <Modal
        title={
          <>
            Agent Specification{" "}
            <span className="text-accent font-normal">
              {localWorkflow?.name}
            </span>{" "}
          </>
        }
        width={800}
        open={showWorkflowModal}
        onOk={() => {
          setShowWorkflowModal(false);
          if (handler) {
            handler(localWorkflow as IFlowConfig);
          }
        }}
        onCancel={() => {
          setShowWorkflowModal(false);
          setWorkflow(null);
        }}
      >
        {localWorkflow && (
          <FlowConfigViewer
            flowConfig={localWorkflow}
            setFlowConfig={setLocalWorkflow}
          />
        )}
      </Modal>
    );
  };

  return (
    <div className="  ">
      <WorkflowModal
        workflow={selectedWorkflow}
        setWorkflow={setSelectedWorkflow}
        showWorkflowModal={showWorkflowModal}
        setShowWorkflowModal={setShowWorkflowModal}
        handler={(workflow: IFlowConfig) => {
          saveWorkFlow(workflow);
          setShowWorkflowModal(false);
        }}
      />

      <WorkflowModal
        workflow={newWorkflow}
        setWorkflow={setNewWorkflow}
        showWorkflowModal={showNewWorkflowModal}
        setShowWorkflowModal={setShowNewWorkflowModal}
        handler={(workflow: IFlowConfig) => {
          saveWorkFlow(workflow);
          setShowNewWorkflowModal(false);
        }}
      />

      <div className="mb-2   relative">
        <div className="overflow-x-hidden scroll     rounded  ">
          <div className="font-semibold mb-2 pb-1 border-b">
            {" "}
            Workflows ({workflowRows.length}){" "}
          </div>
          <div className="text-xs mb-2 pb-1  ">
            {" "}
            Configure an agent workflow that can be used to handle tasks.
          </div>
          {workflows && (
            <div
              style={{ height: "160px" }}
              className="w-full scroll  overflow-auto relative"
            >
              <div className="   flex flex-wrap gap-3">{workflowRows}</div>
            </div>
          )}
        </div>

        <div className="flex mt-2">
          <div className="flex-1"></div>
          <LaunchButton
            className="text-sm p-2 px-3"
            onClick={() => {
              setShowNewWorkflowModal(true);
            }}
          >
            {" "}
            <PlusIcon className="w-5 h-5 inline-block mr-1" />
            New Workflow
          </LaunchButton>
        </div>
      </div>
    </div>
  );
};

export default WorkflowView;
