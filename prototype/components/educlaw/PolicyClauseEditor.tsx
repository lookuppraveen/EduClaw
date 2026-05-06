"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PolicyClause } from "@/lib/mock/types";

export type PolicyClauseEditorProps = {
  initialClauses?: PolicyClause[];
  onChange?: (clauses: PolicyClause[]) => void;
};

export function PolicyClauseEditor({ initialClauses = [], onChange }: PolicyClauseEditorProps) {
  const [clauses, setClauses] = useState<PolicyClause[]>(initialClauses);

  const update = (next: PolicyClause[]) => {
    setClauses(next);
    onChange?.(next);
  };

  const addClause = () =>
    update([
      ...clauses,
      {
        id: `cl_${Date.now()}`,
        rule: "",
        whenToApply: "",
        onViolation: "modify",
      },
    ]);

  const removeClause = (id: string) => update(clauses.filter((c) => c.id !== id));

  const editClause = (id: string, field: keyof PolicyClause, value: string) =>
    update(
      clauses.map((c) =>
        c.id === id
          ? {
              ...c,
              [field]:
                field === "onViolation" ? (value as PolicyClause["onViolation"]) : value,
            }
          : c
      )
    );

  return (
    <div className="space-y-4">
      {clauses.map((clause, i) => (
        <Card key={clause.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-sm">Clause {i + 1}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={clause.onViolation === "block" ? "destructive" : "warning"}>
                On violation: {clause.onViolation}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeClause(clause.id)}
                aria-label={`Remove clause ${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor={`rule-${clause.id}`}>Rule</Label>
              <Input
                id={`rule-${clause.id}`}
                value={clause.rule}
                onChange={(e) => editClause(clause.id, "rule", e.target.value)}
                placeholder="e.g. Do not provide the final answer to graded problems."
              />
            </div>
            <div>
              <Label htmlFor={`when-${clause.id}`}>When to apply</Label>
              <Input
                id={`when-${clause.id}`}
                value={clause.whenToApply}
                onChange={(e) => editClause(clause.id, "whenToApply", e.target.value)}
                placeholder="e.g. Student references a problem number on the active assignment."
              />
            </div>
            <div>
              <Label>On violation</Label>
              <div className="mt-1 flex gap-2">
                {(["modify", "block"] as const).map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    size="sm"
                    variant={clause.onViolation === opt ? "default" : "outline"}
                    onClick={() => editClause(clause.id, "onViolation", opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={addClause}>
        <Plus className="h-4 w-4" />
        Add clause
      </Button>
    </div>
  );
}
