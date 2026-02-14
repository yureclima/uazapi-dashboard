-- ADICIONAR COLUNA PARA TOKEN
ALTER TABLE public.connections 
ADD COLUMN IF NOT EXISTS token text;

-- (Opcional) Se quiser garantir que não seja nulo no futuro, mas para instâncias antigas ficará nulo
-- ALTER TABLE public.connections ALTER COLUMN token SET NOT NULL;
