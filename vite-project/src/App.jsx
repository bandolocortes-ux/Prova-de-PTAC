import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [ideias, setIdeias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [titulo, setTitulo] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [operacaoId, setOperacaoId] = useState(null)

  useEffect(() => {
    async function carregarIdeias() {
      try {
        const API_URL = 'https://jsonplaceholder.typicode.com/todos'
        const response = await fetch(`${API_URL}?_limit=15`)
        if (!response.ok) throw new Error('Não foi possível carregar as ideias.')
        const ideiasRecebidas = await response.json()
        setIdeias(
          ideiasRecebidas.map((ideia, indice) => ({
            ...ideia,
            title: titulosIniciais[indice] ?? ideia.title,
          })),
        )
      } catch {
        setErro('Não foi possível carregar as ideias. Tente novamente.')
      } finally {
        setCarregando(false)
      }
    }
    carregarIdeias()
  }, [])

  function cancelarEdicao() {
    setTitulo('')
    setEditandoId(null)
    setErro('')
  }

  function iniciarEdicao(ideia) {
    setTitulo(ideia.title)
    setEditandoId(ideia.id)
    setErro('')
  }

  async function salvarIdeia(event) {
    event.preventDefault()
    const tituloLimpo = titulo.trim()
    if (!tituloLimpo || salvando) return

    setSalvando(true)
    setErro('')

    try {
      const API_URL = 'https://jsonplaceholder.typicode.com/todos'
      if (editandoId !== null) {
        const ideiaAtual = ideias.find((ideia) => ideia.id === editandoId)
        const response = await fetch(`${API_URL}/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...ideiaAtual,
            title: tituloLimpo,
          }),
        })
        if (!response.ok) throw new Error('Não foi possível editar a ideia.')
        const ideiaAtualizada = await response.json()
        setIdeias((lista) =>
          lista.map((ideia) =>
            ideia.id === editandoId ? { ...ideia, ...ideiaAtualizada, title: tituloLimpo } : ideia,
          ),
        )
      } else {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 1, title: tituloLimpo, completed: false }),
        })
        if (!response.ok) throw new Error('Não foi possível cadastrar a ideia.')
        const novaIdeia = await response.json()
        setIdeias((lista) => [...lista, novaIdeia])
      }
      cancelarEdicao()
    } catch (error) {
      setErro(error.message)
    } finally {
      setSalvando(false)
    }
  }

  async function excluirIdeia(ideia) {
    const indiceOriginal = ideias.findIndex((item) => item.id === ideia.id)
    setOperacaoId(ideia.id)
    setErro('')
    setIdeias((lista) => lista.filter((item) => item !== ideia))

    try {
      const API_URL = 'https://jsonplaceholder.typicode.com/todos'
      const response = await fetch(`${API_URL}/${ideia.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Não foi possível excluir a ideia.')
    } catch (error) {
      setIdeias((lista) => {
        const restaurada = [...lista]
        restaurada.splice(indiceOriginal, 0, ideia)
        return restaurada
      })
      setErro(error.message)
    } finally {
      setOperacaoId(null)
    }
  }

  async function alternarConclusao(ideia) {
    const concluida = !ideia.completed
    setOperacaoId(ideia.id)
    setErro('')
    setIdeias((lista) =>
      lista.map((item) => (item.id === ideia.id ? { ...item, completed: concluida } : item)),
    )

    try {
      const API_URL = 'https://jsonplaceholder.typicode.com/todos'
      const response = await fetch(`${API_URL}/${ideia.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ideia, completed: concluida }),
      })
      if (!response.ok) throw new Error('Não foi possível atualizar o status.')
    } catch (error) {
      setIdeias((lista) =>
        lista.map((item) => (item.id === ideia.id ? { ...item, completed: ideia.completed } : item)),
      )
      setErro(error.message)
    } finally {
      setOperacaoId(null)
    }
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <p className="eyebrow">Aula 03 · ideias em movimento</p>
        <h1>Quadro de ideias</h1>
        <p className="subtitle">Registre o que merece sair do papel.</p>
      </header>

      <form className="idea-form" onSubmit={salvarIdeia}>
        <label htmlFor="titulo">{editandoId === null ? 'Nova ideia' : 'Editar ideia'}</label>
        <div className="form-row">
          <input
            id="titulo"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Ex.: criar um clube de leitura"
            maxLength={120}
          />
          <button type="submit" disabled={salvando || !titulo.trim()}>
            {salvando ? 'Salvando...' : editandoId === null ? 'Adicionar' : 'Salvar'}
          </button>
          {editandoId !== null && (
            <button type="button" className="button-secondary" onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {erro && <p className="error-message" role="alert">{erro}</p>}

      <section className="ideas-section" aria-live="polite">
        <div className="section-heading">
          <h2>Suas ideias</h2>
          {!carregando && <span>{ideias.length} {ideias.length === 1 ? 'ideia' : 'ideias'}</span>}
        </div>

        {carregando && <p className="feedback">Carregando ideias...</p>}
        {!carregando && !erro && ideias.length === 0 && (
          <p className="feedback">Nenhuma ideia por aqui — que tal cadastrar a primeira?</p>
        )}
        {!carregando && ideias.length > 0 && (
          <div className="idea-grid">
            {ideias.map((ideia) => (
              <article className={`idea-card ${ideia.completed ? 'is-completed' : ''}`} key={ideia.id}>
                <div className="card-topline">
                  <span className="status-dot" aria-hidden="true" />
                  <span>{ideia.completed ? 'Executada' : 'Pendente'}</span>
                </div>
                <h3>{ideia.title}</h3>
                <div className="card-actions">
                  <button type="button" onClick={() => alternarConclusao(ideia)} disabled={operacaoId === ideia.id}>
                    {ideia.completed ? 'Reabrir' : 'Marcar como feita'}
                  </button>
                  <button type="button" onClick={() => iniciarEdicao(ideia)} disabled={operacaoId === ideia.id}>
                    Editar
                  </button>
                  <button type="button" className="delete-button" onClick={() => excluirIdeia(ideia)} disabled={operacaoId === ideia.id}>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App
