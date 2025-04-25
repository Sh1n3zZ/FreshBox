import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface ListFormProps<T> {
  columns: {
    header: string;
    accessorKey: string;
    cell?: (row: T) => React.ReactNode;
  }[];
  data: T[];
  total: number;
  page: number;
  size: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onSearch: (keyword: string) => void;
  onFilterChange?: (filters: Record<string, string>) => void;
  filters?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  loading?: boolean;
}

const ALL_VALUE = '__ALL__';

export function ListForm<T>({
  columns,
  data,
  total,
  page,
  size,
  onPageChange,
  onSizeChange,
  onSearch,
  onFilterChange,
  filters,
  loading = false,
}: ListFormProps<T>) {
  const totalPages = Math.ceil(total / size);
  const [searchKeyword, setSearchKeyword] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchKeyword);
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* 搜索和筛选区域 */}
        <div className="flex flex-wrap gap-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="搜索..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-[200px]"
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {filters?.map((filter) => (
            <Select
              key={filter.key}
              onValueChange={(value) =>
                onFilterChange?.({ [filter.key]: value === ALL_VALUE ? '' : value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem 
                    key={option.value || ALL_VALUE} 
                    value={option.value || ALL_VALUE}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        {/* 表格区域 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.accessorKey}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.accessorKey}>
                        {column.cell
                          ? column.cell(row)
                          : (row as any)[column.accessorKey]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页区域 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>每页显示</span>
            <Select
              value={size.toString()}
              onValueChange={(value) => onSizeChange(Number(value))}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>条</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              第 {page} 页，共 {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
