const { lerArquivo, escreverNoArquivo } = require("../bibliotecaFS");
const { addBusinessDays } = require("date-fns");

async function getProdutos(req, res) {
  const categoria = req.query.categoria;
  const precoInicial = Number(req.query.precoInicial);
  const precoFinal = Number(req.query.precoFinal);
  const { produtos } = await lerArquivo();
  const produtosFiltrados = produtos
    .filter((produto) => produto.estoque)
    .filter((produto) => {
      if (!(categoria || precoInicial || precoFinal)) {
        return produto;
      }
      if (categoria) {
        if (precoInicial && precoFinal) {
          if (
            precoInicial <= produto.preco &&
            produto.preco <= precoFinal &&
            categoria === produto.categoria
          ) {
            return produto;
          }
        } else if (precoInicial) {
          if (
            precoInicial <= produto.preco &&
            categoria === produto.categoria
          ) {
            return produto;
          }
        } else if (precoFinal) {
          if (produto.preco <= precoFinal && categoria === produto.categoria) {
            return produto;
          }
        } else if (categoria === produto.categoria) {
          return produto;
        }
      } else {
        if (precoInicial && precoFinal) {
          if (precoInicial <= produto.preco && produto.preco <= precoFinal) {
            return produto;
          }
        } else if (precoInicial) {
          if (precoInicial <= produto.preco) {
            return produto;
          }
        } else if (precoFinal) {
          if (produto.preco <= precoFinal) {
            return produto;
          }
        }
      }
    });
  res.json(produtosFiltrados);
}

async function getCarrinho(req, res) {
  const { produtos: produtosEmEstoque, carrinho } = await lerArquivo();
  const produtosDoCarrinho = carrinho.produtos;
  const data = new Date();
  const dataDeEntrega = addBusinessDays(data, 15);

  let subTotal = 0;
  for (const produto of produtosDoCarrinho) {
    subTotal += produto.preco * produto.quantidade;
  }

  const total = subTotal ? subTotal : 0;

  const valorDoFrete = subTotal > 20000 ? 0 : 5000;
  const frete = subTotal ? valorDoFrete : 0;

  const carrinhoFormatado = {
    produtos: produtosDoCarrinho,
    subTotal: total,
    dataDeEntrega: subTotal ? dataDeEntrega : null,
    valorDoFrete: frete,
    totalAPagar: total + frete,
  };

  await escreverNoArquivo({
    produtos: produtosEmEstoque,
    carrinho: carrinhoFormatado,
  });

  res.json(carrinhoFormatado);
}

async function inserirProdutoNoCarrinho(req, res) {
  const { produtos: produtosEmEstoque, carrinho } = await lerArquivo();

  const id = Number(req.body.id);
  const quantidade = Number(req.body.quantidade);

  const produto = produtosEmEstoque.find((produto) => produto.id === id);
  const indiceProdutoDoCarrinho = carrinho.produtos.findIndex(
    (produtoDoCarrinho) => produtoDoCarrinho.id === id
  );

  if (produto) {
    if (produto.estoque >= quantidade) {
      if (indiceProdutoDoCarrinho !== -1) {
        carrinho.produtos[indiceProdutoDoCarrinho].quantidade += 1;
      } else {
        const produtoFormatado = {
          id: produto.id,
          quantidade: quantidade,
          nome: produto.nome,
          preco: produto.preco,
          categoria: produto.categoria,
        };
        carrinho.produtos.push(produtoFormatado);
      }
      await escreverNoArquivo({
        produtos: produtosEmEstoque,
        carrinho: carrinho,
      });
      return getCarrinho(req, res);
    } else {
      res.json("O estoque não contém a quantidade desejada de", produto.nome);
    }
  } else {
    res.json("O ID informado não é válido");
  }
}

async function editarQuantidade(req, res) {
  const { produtos: produtosEmEstoque, carrinho } = await lerArquivo();

  const quantidade = Number(req.body.quantidade);
  const id = Number(req.params.idProduto);
  const indiceProdutoDoCarrinho = carrinho.produtos.findIndex(
    (produtoDoCarrinho) => produtoDoCarrinho.id === id
  );

  const indiceProdutoEmEstoque = produtosEmEstoque.findIndex(
    (produtoEmEstoque) => produtoEmEstoque.id === id
  );

  if (indiceProdutoDoCarrinho !== -1) {
    if (quantidade > 0) {
      if (produtosEmEstoque[indiceProdutoEmEstoque].estoque >= quantidade) {
        produtosEmEstoque[indiceProdutoEmEstoque].estoque -= quantidade;
        carrinho.produtos[indiceProdutoDoCarrinho].quantidade += quantidade;
      } else {
        res.json("O estoque não contém a quantidade desejada de", produto.nome);
        return;
      }
    } else {
      if (
        -1 * quantidade >
        carrinho.produtos[indiceProdutoDoCarrinho].quantidade
      ) {
        res.json(
          `O carrinho não possui ${-1 * quantidade} de ${
            carrinho.produtos[indiceProdutoDoCarrinho].nome
          } para remover`
        );
        return;
      } else {
        produtosEmEstoque[indiceProdutoEmEstoque].estoque -= quantidade;
        carrinho.produtos[indiceProdutoDoCarrinho].quantidade += quantidade;

        if (carrinho.produtos[indiceProdutoDoCarrinho].quantidade === 0) {
          carrinho.produtos.splice(indiceProdutoDoCarrinho, 1);
        }
      }
    }
  } else {
    res.json("O produto informado ainda não foi adicionado ao carrinho");
    return;
  }

  await escreverNoArquivo({
    produtos: produtosEmEstoque,
    carrinho: carrinho,
  });

  return getCarrinho(req, res);
}

module.exports = {
  getProdutos,
  getCarrinho,
  inserirProdutoNoCarrinho,
  editarQuantidade,
};