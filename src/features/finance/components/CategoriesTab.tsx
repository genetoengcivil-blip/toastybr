import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Plus, Trash2 } from 'lucide-react'
import {
  useFinancialCategories, useCreateFinancialCategory, useDeleteFinancialCategory,
  useCostCenters, useCreateCostCenter, useDeleteCostCenter,
} from '../hooks'

export default function CategoriesTab() {
  const [showCatDialog, setShowCatDialog] = useState(false)
  const [showCCDialog, setShowCCDialog] = useState(false)
  const [catName, setCatName] = useState('')
  const [catType, setCatType] = useState<'income' | 'expense'>('expense')
  const [ccName, setCCName] = useState('')
  const [ccDesc, setCCDesc] = useState('')

  const { data: categories = [], isLoading: catLoading } = useFinancialCategories()
  const { data: costCenters = [], isLoading: ccLoading } = useCostCenters()
  const createCat = useCreateFinancialCategory()
  const deleteCat = useDeleteFinancialCategory()
  const createCC = useCreateCostCenter()
  const deleteCC = useDeleteCostCenter()

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const handleCreateCat = async () => {
    if (!catName.trim()) return
    try {
      await createCat.mutateAsync({ name: catName.trim(), type: catType })
      setShowCatDialog(false)
      setCatName('')
    } catch { /* toast */ }
  }

  const handleCreateCC = async () => {
    if (!ccName.trim()) return
    try {
      await createCC.mutateAsync({ name: ccName.trim(), description: ccDesc || undefined })
      setShowCCDialog(false)
      setCCName('')
      setCCDesc('')
    } catch { /* toast */ }
  }

  return (
    <Tabs defaultValue="categories">
      <TabsList>
        <TabsTrigger value="categories">Categorias</TabsTrigger>
        <TabsTrigger value="cost-centers">Centros de Custo</TabsTrigger>
      </TabsList>

      <TabsContent value="categories">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Categorias Financeiras</CardTitle>
            <Button size="sm" onClick={() => setShowCatDialog(true)}>
              <Plus size={16} className="mr-1" /> Nova
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {catLoading ? (
              <div className="p-4 space-y-2">{[1, 2].map((i) => <div key={i} className="h-10 animate-pulse bg-[hsl(var(--muted))]" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeCategories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant="success">Receita</Badge></TableCell>
                      <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => deleteCat.mutate(c.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenseCategories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant="destructive">Despesa</Badge></TableCell>
                      <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => deleteCat.mutate(c.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-[hsl(var(--muted-foreground))] py-8">
                        Nenhuma categoria criada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cost-centers">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Centros de Custo</CardTitle>
            <Button size="sm" onClick={() => setShowCCDialog(true)}>
              <Plus size={16} className="mr-1" /> Novo
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {ccLoading ? (
              <div className="p-4 space-y-2">{[1, 2].map((i) => <div key={i} className="h-10 animate-pulse bg-[hsl(var(--muted))]" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costCenters.map((cc) => (
                    <TableRow key={cc.id}>
                      <TableCell className="font-medium">{cc.name}</TableCell>
                      <TableCell className="text-[hsl(var(--muted-foreground))]">{cc.description || '—'}</TableCell>
                      <TableCell><Badge variant={cc.is_active ? 'default' : 'secondary'}>{cc.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => deleteCC.mutate(cc.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {costCenters.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-[hsl(var(--muted-foreground))] py-8">
                        Nenhum centro de custo criado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Create Category Dialog */}
      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" value={catName} onChange={(e) => setCatName(e.target.value)} />
            <div className="flex gap-2">
              <Button variant={catType === 'income' ? 'default' : 'outline'} className="flex-1" onClick={() => setCatType('income')}>Receita</Button>
              <Button variant={catType === 'expense' ? 'default' : 'outline'} className="flex-1" onClick={() => setCatType('expense')}>Despesa</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCatDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateCat} disabled={createCat.isPending}>
              {createCat.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Cost Center Dialog */}
      <Dialog open={showCCDialog} onOpenChange={setShowCCDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Centro de Custo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" value={ccName} onChange={(e) => setCCName(e.target.value)} />
            <Input placeholder="Descrição (opcional)" value={ccDesc} onChange={(e) => setCCDesc(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCCDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateCC} disabled={createCC.isPending}>
              {createCC.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
