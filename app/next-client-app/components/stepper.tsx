"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Define steps
const Stages = [
  {
    id: 1,
    title: "Not started",
    description: "no started",
  },
  {
    id: 2,
    title: "In Progress",
    description: "in pro.",
  },
  {
    id: 3,
    title: "Failed",
    description: "Failed",
  },
];

// Define steps
const STEPS = [
  {
    id: 1,
    title: "Shipping",
    description: "Enter your shipping details",
    stage: Stages,
  },
  {
    id: 2,
    title: "Payment",
    description: "Enter your payment details",
    stage: Stages,
  },
  {
    id: 3,
    title: "Complete",
    description: "Checkout complete",
    stage: Stages,
  },
];

function StepperComponent() {
  // This should be passed as a prop or controlled by parent component
  const currentState = 0; // Example fixed state
  const currentSubStage = 1;

  const currentIndex = STEPS.findIndex((step) => step.id === currentState);

  const renderStepContent = () => {
    switch (currentState) {
      case 1:
        return <ShippingComponent />;
      case 2:
        return <PaymentComponent />;
      case 3:
        return <CompleteComponent />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6 border rounded-lg w-[450px]">
      <div className="flex justify-between">
        <h2 className="text-lg font-medium">Checkout</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Step {currentIndex + 1} of {STEPS.length}
          </span>
        </div>
      </div>

      <ol
        className="flex items-center justify-between gap-2"
        aria-orientation="horizontal"
      >
        {STEPS.map((step, index, array) => (
          <React.Fragment key={step.id}>
            <li className="flex items-center gap-4 flex-shrink-0">
              <Button
                type="button"
                role="tab"
                aria-current={currentState === step.id ? "step" : undefined}
                aria-posinset={index + 1}
                aria-setsize={STEPS.length}
                aria-selected={currentState === step.id}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full bg-carrot-200",
                  index == currentIndex &&
                    currentSubStage == 2 &&
                    "bg-yellow-500",
                  index == currentIndex && currentSubStage == 3 && "bg-red-500",
                  index < currentIndex && "bg-green-500"
                )}
              >
                {index < currentIndex && <Check className="size-5" />}
                {index == currentIndex && currentSubStage == 2 && (
                  <Loader2 className="animate-spin size-5" />
                )}
                {index == currentIndex && currentSubStage == 3 && (
                  <X className=" size-5" />
                )}
              </Button>
              <span className="text-sm font-medium">{step.title}</span>
            </li>
            {index < array.length - 1 && (
              <Separator
                className={`flex-1 ${
                  index < currentIndex ? "bg-carrot" : "bg-muted"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </ol>

      <div className="space-y-4">{renderStepContent()}</div>
    </div>
  );
}

// Step Components
const ShippingComponent = () => (
  <div className="grid gap-4">
    <div className="grid gap-2">
      <label htmlFor="name" className="text-sm font-medium text-start">
        Name
      </label>
      <Input id="name" placeholder="John Doe" className="w-full" />
    </div>
    <div className="grid gap-2">
      <label htmlFor="address" className="text-sm font-medium text-start">
        Address
      </label>
      <Textarea
        id="address"
        placeholder="123 Main St, Anytown USA"
        className="w-full"
      />
    </div>
  </div>
);

const PaymentComponent = () => (
  <div className="grid gap-4">
    <div className="grid gap-2">
      <label htmlFor="card-number" className="text-sm font-medium text-start">
        Card Number
      </label>
      <Input
        id="card-number"
        placeholder="4111 1111 1111 1111"
        className="w-full"
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <label htmlFor="expiry-date" className="text-sm font-medium text-start">
          Expiry Date
        </label>
        <Input id="expiry-date" placeholder="MM/YY" className="w-full" />
      </div>
      <div className="grid gap-2">
        <label htmlFor="cvc" className="text-sm font-medium text-start">
          CVC
        </label>
        <Input id="cvc" placeholder="123" className="w-full" />
      </div>
    </div>
  </div>
);

const CompleteComponent = () => (
  <h3 className="text-lg py-4 font-medium">Checkout complete! 🎉</h3>
);

export default StepperComponent;
