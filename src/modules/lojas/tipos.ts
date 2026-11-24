export const MENSAGEM_ERRO_GENERICO =
  "Não foi possível concluir a operação. Tente novamente.";

export interface Loja {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface PaginaPedida {
  pagina: number;
  tamanho: number;
}

export interface PaginaBruta {
  itens: Loja[];
  total: number;
}

/** Nome já usado por outra loja (sem diferenciar maiúsculas). */
export class NomeDuplicadoError extends Error {
  constructor() {
    super("Nome de loja duplicado");
    this.name = "NomeDuplicadoError";
  }
}

/** Falha inesperada de acesso a dados (detalhe só no log do servidor). */
export class LojaErroDesconhecidoError extends Error {
  constructor() {
    super(MENSAGEM_ERRO_GENERICO);
    this.name = "LojaErroDesconhecidoError";
  }
}

/** Acesso a dados; a implementação real fica em repositorio.ts. */
export interface RepositorioLojas {
  listar(pedido: PaginaPedida): Promise<PaginaBruta>;
  /** Lança NomeDuplicadoError se o nome já existe. */
  inserir(nome: string): Promise<Loja>;
  /** Lança NomeDuplicadoError; devolve null se a loja não existe. */
  atualizarNome(id: string, nome: string): Promise<Loja | null>;
  atualizarAtivo(id: string, ativo: boolean): Promise<Loja | null>;
  /** Devolve null se a loja não existe. */
  obter(id: string): Promise<Loja | null>;
}
