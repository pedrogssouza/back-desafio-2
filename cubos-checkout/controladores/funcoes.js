const { lerArquivo, escreverNoArquivo } = require("../bibliotecaFS");
const { addBusinessDays } = require("date-fns");

async function getProdutos(req, res) {
  const categoria = req.query.categoria;
  const precoInicial = Number(req.query.precoInicial);
  const precoFinal = Number(req.query.precoFinal);
  const dados = await lerArquivo();
  const produtos = dados.produtos
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
  res.json(produtos);
}

async function getCarrinho(req, res) {
  const dados = await lerArquivo();
  const produtosDoCarrinho = dados.carrinho.produtos;
  const produtosEmEstoque = dados.produtos;
  const data = new Date();
  const dataDeEntrega = addBusinessDays(data, 15);

  let subTotal = 0;
  for (const produto of produtosDoCarrinho) {
    subTotal += produto.preco * produto.quantidade;
  }

  const total = subTotal ? subTotal : 0;

  const valorDoFrete = subTotal > 20000 ? 0 : 5000;
  const frete = subTotal ? valorDoFrete : 0;

  const carrinho = {
    produtos: produtosDoCarrinho,
    subTotal: total,
    dataDeEntrega: subTotal ? dataDeEntrega : null,
    valorDoFrete: frete,
    totalAPagar: total + frete,
  };

  const resultado = {
    carrinho: carrinho,
  };

  res.json(resultado);
}

async function inserirProdutoNoCarrinho(req, res) {
  const { produtos, carrinho } = await lerArquivo();

  const id = Number(req.body.id);
  const quantidade = Number(req.body.quantidade);

  const produto = produtos.find((produto) => produto.id === id);
  const indiceProdutoDoCarrinho = carrinho.produtos.findIndex(
    (produtoDoCarrinho) => produtoDoCarrinho.id === id
  );

  if (produto) {
    if (produto.estoque >= quantidade) {
      if (indiceProdutoDoCarrinho !== -1) {
        carrinho.produtos[indiceProdutoDoCarrinho].quantidade += 1;
        // console.log(carrinho.produtos[indiceProdutoDoCarrinho]);
        // console.log(indiceProdutoDoCarrinho);
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
        produtos: produtos,
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

module.exports = { getProdutos, getCarrinho, inserirProdutoNoCarrinho };
