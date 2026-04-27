import { FileText } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { VotingRecordListItem } from "@/types/votingRecord"

export function VotingRecordsTable({
  records,
  isLoading,
}: {
  records: VotingRecordListItem[]
  isLoading: boolean
}) {
  return (
    <Card className="w-full rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Registro de votos</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da eleição</TableHead>
              <TableHead className="w-[140px]">Rodada</TableHead>
              <TableHead className="w-[170px]">CPF</TableHead>
              <TableHead className="w-[220px]">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-56 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <div className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/5">
                      <FileText className="size-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">Nenhum registro encontrado</div>
                    <div className="text-xs text-muted-foreground">
                      Tente ajustar os filtros para localizar registros.
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.electionName}</TableCell>
                  <TableCell>{record.roundNumber}</TableCell>
                  <TableCell>{record.cpf}</TableCell>
                  <TableCell>{record.ip}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

