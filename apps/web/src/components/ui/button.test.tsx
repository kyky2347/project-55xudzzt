import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("preserves an accessible action name and invokes its action", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Enter the dark</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Enter the dark" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not invoke disabled sensor-style actions", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Active sonar</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Active sonar" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
