-- Adicionar coluna completed_date à tabela tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP WITH TIME ZONE;

-- Atualizar tarefas já completadas com a data de atualização
UPDATE tasks 
SET completed_date = updated_at 
WHERE status = 'completed' AND completed_date IS NULL;

-- Criar trigger para atualizar completed_date automaticamente
CREATE OR REPLACE FUNCTION update_completed_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou para completed, definir completed_date
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_date = NOW();
  END IF;
  
  -- Se o status mudou de completed para outro, limpar completed_date
  IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_date = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_completed_date ON tasks;
CREATE TRIGGER trigger_update_completed_date
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_completed_date();