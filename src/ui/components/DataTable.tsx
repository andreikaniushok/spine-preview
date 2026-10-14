import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import type { ReactNode } from "react";

export interface DataTableColumn {
  id: string;
  label: ReactNode;
  align?: "left" | "right" | "center";
}

export interface DataTableProps {
  columns: readonly DataTableColumn[];
  rows: readonly ReactNode[][];
  dense?: boolean;
}

export function DataTable({ columns, rows, dense = true }: DataTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 280 }}>
      <Table size={dense ? "small" : "medium"} stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.id} align={col.align}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((cells, rowIndex) => (
            <TableRow key={rowIndex} hover>
              {cells.map((cell, cellIndex) => (
                <TableCell
                  key={columns[cellIndex]?.id ?? cellIndex}
                  align={columns[cellIndex]?.align}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
