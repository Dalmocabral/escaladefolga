import { useState, useEffect } from 'react';
import type { ShiftConfig, ShiftId, Employee } from './types';
import { ShiftPage } from './components/ShiftPage';
import { Clock, ArrowRight } from 'lucide-react';

const SHIFT_CONFIGS: ShiftConfig[] = [
  {
    id: 'manha',
    title: 'Escala Turno Manhã',
    emoji: '🌅',
    timeRange: '06:00 — 14:00',
    bgImage: '/images/shifts/manha.jpg',
  },
  {
    id: 'tarde',
    title: 'Escala Turno Tarde',
    emoji: '🌤️',
    timeRange: '14:00 — 22:00',
    bgImage: '/images/shifts/tarde.jpg',
  },
  {
    id: 'noite',
    title: 'Escala Turno Noite',
    emoji: '🌙',
    timeRange: '22:00 — 06:00',
    bgImage: '/images/shifts/noite.jpg',
  },
];

// Nomes e matrículas fiéis à planilha de exemplo do usuário
const INITIAL_EMPLOYEES: Employee[] = [
  // 10 Operadores de Bloco no Turno Manhã (divisão exata: 3 Verde, 3 Azul, 4 Amarelo)
  { id: '1', name: 'Andre de Oliveira', registration: '1361', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '2', name: 'Leandro Jacob', registration: '1355', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '3', name: 'Dalmo Cabral', registration: '1070', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '4', name: 'Roberto Melo', registration: '1472', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '5', name: 'Marcio Souza', registration: '1365', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '6', name: 'Alexandre Anacleto', registration: '1190', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '7', name: 'Alexandre Souza', registration: '1240', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '8', name: 'Cristiano Martins', registration: '1312', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '9', name: 'Claudio Jesus', registration: '1288', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '10', name: 'Jony Cunha', registration: '1400', role: 'Operador de Bloco', shiftId: 'manha' },

  // 40 Motoristas no Turno Manhã (divisão exata: 5 equipes x 8 colaboradores)
  { id: '11', name: 'Carlos Eduardo Silva', registration: '1001', role: 'Motorista', shiftId: 'manha' },
  { id: '12', name: 'Jorge Ribeiro Santos', registration: '1002', role: 'Motorista', shiftId: 'manha' },
  { id: '13', name: 'Fábio Alencar', registration: '1003', role: 'Motorista', shiftId: 'manha' },
  { id: '14', name: 'Paulo Henrique Lima', registration: '1004', role: 'Motorista', shiftId: 'manha' },
  { id: '15', name: 'Lucas Gabriel Costa', registration: '1005', role: 'Motorista', shiftId: 'manha' },
  { id: '16', name: 'Rodrigo Medeiros', registration: '1006', role: 'Motorista', shiftId: 'manha' },
  { id: '17', name: 'Fernando Dias', registration: '1007', role: 'Motorista', shiftId: 'manha' },
  { id: '18', name: 'Marcos Vinícius Prado', registration: '1008', role: 'Motorista', shiftId: 'manha' },
  { id: '19', name: 'Thiago Vieira', registration: '1009', role: 'Motorista', shiftId: 'manha' },
  { id: '20', name: 'Alan Kardec Gomes', registration: '1010', role: 'Motorista', shiftId: 'manha' },
  { id: '21', name: 'Bruno Cesar Fagundes', registration: '1011', role: 'Motorista', shiftId: 'manha' },
  { id: '22', name: 'Caio Vinicius Moreira', registration: '1012', role: 'Motorista', shiftId: 'manha' },
  { id: '23', name: 'Daniel Nogueira Lima', registration: '1013', role: 'Motorista', shiftId: 'manha' },
  { id: '24', name: 'Eduardo Paes Barreto', registration: '1014', role: 'Motorista', shiftId: 'manha' },
  { id: '25', name: 'Fabricio Ramos Silveira', registration: '1015', role: 'Motorista', shiftId: 'manha' },
  { id: '26', name: 'Gabriel Menezes Castro', registration: '1016', role: 'Motorista', shiftId: 'manha' },
  { id: '27', name: 'Hugo Leonardo Pires', registration: '1017', role: 'Motorista', shiftId: 'manha' },
  { id: '28', name: 'Igor Santos Guimarães', registration: '1018', role: 'Motorista', shiftId: 'manha' },
  { id: '29', name: 'Jonathan Farias Alves', registration: '1019', role: 'Motorista', shiftId: 'manha' },
  { id: '30', name: 'Kleber Toledo Sobrinho', registration: '1020', role: 'Motorista', shiftId: 'manha' },
  { id: '31', name: 'Leonardo Vasconcelos', registration: '1021', role: 'Motorista', shiftId: 'manha' },
  { id: '32', name: 'Marcelo Duarte Freitas', registration: '1022', role: 'Motorista', shiftId: 'manha' },
  { id: '33', name: 'Nilson Correa Pinheiro', registration: '1023', role: 'Motorista', shiftId: 'manha' },
  { id: '34', name: 'Otavio Augusto Miranda', registration: '1024', role: 'Motorista', shiftId: 'manha' },
  { id: '35', name: 'Paulo Roberto Peixoto', registration: '1025', role: 'Motorista', shiftId: 'manha' },
  { id: '36', name: 'Rafael Antunes Borges', registration: '1026', role: 'Motorista', shiftId: 'manha' },
  { id: '37', name: 'Sergio Magalhães Neto', registration: '1027', role: 'Motorista', shiftId: 'manha' },
  { id: '38', name: 'Tiago Beltrão Fonseca', registration: '1028', role: 'Motorista', shiftId: 'manha' },
  { id: '39', name: 'Uelton Martins Siqueira', registration: '1029', role: 'Motorista', shiftId: 'manha' },
  { id: '40', name: 'Valdir Fernandes Jr', registration: '1030', role: 'Motorista', shiftId: 'manha' },
  { id: '41', name: 'Wagner Lopes Queiroz', registration: '1031', role: 'Motorista', shiftId: 'manha' },
  { id: '42', name: 'Xavier Couto Pacheco', registration: '1032', role: 'Motorista', shiftId: 'manha' },
  { id: '43', name: 'Yuri Tavares Carvalho', registration: '1033', role: 'Motorista', shiftId: 'manha' },
  { id: '44', name: 'Zaqueu Mendonça Reis', registration: '1034', role: 'Motorista', shiftId: 'manha' },
  { id: '4401', name: 'André Felipe Rocha', registration: '1035', role: 'Motorista', shiftId: 'manha' },
  { id: '4402', name: 'Bernardo Lima Castro', registration: '1036', role: 'Motorista', shiftId: 'manha' },
  { id: '4403', name: 'Cláudio Roberto Neves', registration: '1037', role: 'Motorista', shiftId: 'manha' },
  { id: '4404', name: 'Diego Moreira Ramos', registration: '1038', role: 'Motorista', shiftId: 'manha' },
  { id: '4405', name: 'Elias Fagundes Silva', registration: '1039', role: 'Motorista', shiftId: 'manha' },
  { id: '4406', name: 'Francisco Xavier Dias', registration: '1040', role: 'Motorista', shiftId: 'manha' },

  // 40 Motoristas no Turno Noite (22:00 - 06:00, 5 equipes x 8 colaboradores)
  { id: '45', name: 'Ademir Rodrigues', registration: '2001', role: 'Motorista', shiftId: 'noite' },
  { id: '46', name: 'Agenor Batista', registration: '2002', role: 'Motorista', shiftId: 'noite' },
  { id: '47', name: 'Almir Guimarães', registration: '2003', role: 'Motorista', shiftId: 'noite' },
  { id: '48', name: 'Álvaro Mendonça', registration: '2004', role: 'Motorista', shiftId: 'noite' },
  { id: '49', name: 'Anderson Ferreira', registration: '2005', role: 'Motorista', shiftId: 'noite' },
  { id: '50', name: 'Antônio Carlos Peixoto', registration: '2006', role: 'Motorista', shiftId: 'noite' },
  { id: '51', name: 'Benedito Soares', registration: '2007', role: 'Motorista', shiftId: 'noite' },
  { id: '52', name: 'Bernardo Nogueira', registration: '2008', role: 'Motorista', shiftId: 'noite' },
  { id: '53', name: 'Breno Silveira', registration: '2009', role: 'Motorista', shiftId: 'noite' },
  { id: '54', name: 'Caio César Santos', registration: '2010', role: 'Motorista', shiftId: 'noite' },
  { id: '55', name: 'Celso Machado', registration: '2011', role: 'Motorista', shiftId: 'noite' },
  { id: '56', name: 'Daniel Farias', registration: '2012', role: 'Motorista', shiftId: 'noite' },
  { id: '57', name: 'Danilo Albuquerque', registration: '2013', role: 'Motorista', shiftId: 'noite' },
  { id: '58', name: 'Denis Carvalho', registration: '2014', role: 'Motorista', shiftId: 'noite' },
  { id: '59', name: 'Douglas Nascimento', registration: '2015', role: 'Motorista', shiftId: 'noite' },
  { id: '60', name: 'Edilson Barbosa', registration: '2016', role: 'Motorista', shiftId: 'noite' },
  { id: '61', name: 'Edvaldo Moreira', registration: '2017', role: 'Motorista', shiftId: 'noite' },
  { id: '62', name: 'Elton Vasconcelos', registration: '2018', role: 'Motorista', shiftId: 'noite' },
  { id: '63', name: 'Evandro Ribeiro', registration: '2019', role: 'Motorista', shiftId: 'noite' },
  { id: '64', name: 'Fabiano Duarte', registration: '2020', role: 'Motorista', shiftId: 'noite' },
  { id: '65', name: 'Gilberto Pinheiro', registration: '2021', role: 'Motorista', shiftId: 'noite' },
  { id: '66', name: 'Gustavo Beltrão', registration: '2022', role: 'Motorista', shiftId: 'noite' },
  { id: '67', name: 'Heitor Magalhães', registration: '2023', role: 'Motorista', shiftId: 'noite' },
  { id: '68', name: 'Igor Antunes', registration: '2024', role: 'Motorista', shiftId: 'noite' },
  { id: '69', name: 'Jailson Fernandes', registration: '2025', role: 'Motorista', shiftId: 'noite' },
  { id: '70', name: 'Leandro Siqueira', registration: '2026', role: 'Motorista', shiftId: 'noite' },
  { id: '71', name: 'Luciano Pacheco', registration: '2027', role: 'Motorista', shiftId: 'noite' },
  { id: '72', name: 'Marcio Prado', registration: '2028', role: 'Motorista', shiftId: 'noite' },
  { id: '73', name: 'Maurício Tavares', registration: '2029', role: 'Motorista', shiftId: 'noite' },
  { id: '74', name: 'Nelson Reis', registration: '2030', role: 'Motorista', shiftId: 'noite' },
  { id: '75', name: 'Osvaldo Ramos', registration: '2031', role: 'Motorista', shiftId: 'noite' },
  { id: '76', name: 'Reginaldo Castro', registration: '2032', role: 'Motorista', shiftId: 'noite' },
  { id: '77', name: 'Robson Pires', registration: '2033', role: 'Motorista', shiftId: 'noite' },
  { id: '78', name: 'Valmir Gomes', registration: '2034', role: 'Motorista', shiftId: 'noite' },
  { id: '79', name: 'Wellington Costa', registration: '2035', role: 'Motorista', shiftId: 'noite' },
  { id: '7901', name: 'Alexandre Fontes', registration: '2036', role: 'Motorista', shiftId: 'noite' },
  { id: '7902', name: 'Bruno Silvano', registration: '2037', role: 'Motorista', shiftId: 'noite' },
  { id: '7903', name: 'Cristiano Valente', registration: '2038', role: 'Motorista', shiftId: 'noite' },
  { id: '7904', name: 'Diogo Nogueira', registration: '2039', role: 'Motorista', shiftId: 'noite' },
  { id: '7905', name: 'Eduardo Sampaio', registration: '2040', role: 'Motorista', shiftId: 'noite' },

  // 12 Operadores de Bloco no Turno Noite (22:00 - 06:00)
  { id: '80', name: 'Ailton Pereira', registration: '2101', role: 'Operador de Bloco', shiftId: 'noite' },
  { id: '81', name: 'Claudio Miranda', registration: '2102', role: 'Operador de Bloco', shiftId: 'noite' },
  { id: '82', name: 'Damião Barreto', registration: '2103', role: 'Operador de Bloco', shiftId: 'noite' },
  { id: '83', name: 'Elias Fontes', registration: '2104', role: 'Operador de Bloco', shiftId: 'noite' },
  { id: '84', name: 'Geraldo Azevedo', registration: '2105', role: 'Operador de Bloco', shiftId: 'noite' },
  { id: '85', name: 'Joel Santana', registration: '2106', role: 'Operador de Bloco', shiftId: 'noite' },
  { id: '86', name: 'Josué Medeiros', registration: '2107', role: 'Operador de Bloco', shiftId: 'noite' },
  { id: '87', name: 'Manoel Viana', registration: '2108', role: 'Operador de Bloco', shiftId: 'noite' },
  { id: '88', name: 'Moacir Figueiredo', registration: '2109', role: 'Operador de Bloco', shiftId: 'noite' },
  { id: '89', name: 'Renato Cordeiro', registration: '2110', role: 'Operador de Bloco', shiftId: 'noite' },
  { id: '90', name: 'Valério Rezende', registration: '2111', role: 'Operador de Bloco', shiftId: 'noite' },
  { id: '91', name: 'Wilson Brandão', registration: '2112', role: 'Operador de Bloco', shiftId: 'noite' },
];

const STORAGE_KEY_EMPLOYEES = 'escala_terminal_employees_v3';

export default function App() {
  const [selectedShiftId, setSelectedShiftId] = useState<ShiftId | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove duplicatas que possam ter sido gravadas anteriormente no banco local
          const seenKeys = new Set<string>();
          const deduped: Employee[] = [];
          for (const emp of parsed) {
            const key = `${emp.shiftId}_${emp.role.toLowerCase()}_${(emp.registration || emp.name).trim().toLowerCase()}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              deduped.push(emp);
            }
          }
          // Garante que os novos colaboradores de INITIAL_EMPLOYEES sejam incorporados ao banco local
          for (const initEmp of INITIAL_EMPLOYEES) {
            const key = `${initEmp.shiftId}_${initEmp.role.toLowerCase()}_${(initEmp.registration || initEmp.name).trim().toLowerCase()}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              deduped.push(initEmp);
            }
          }
          return deduped;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar colaboradores do banco local:', e);
    }
    return INITIAL_EMPLOYEES;
  });

  // Salva no banco de dados local (localStorage)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.error('Erro ao persistir colaboradores no banco local:', e);
    }
  }, [employees]);

  const handleAddEmployee = (newEmp: Omit<Employee, 'id'>) => {
    // Previne inserção duplicada de colaborador (mesma matrícula ou mesmo nome na mesma função/turno)
    const isDuplicate = employees.some(
      (e) =>
        e.shiftId === newEmp.shiftId &&
        e.role.toLowerCase() === newEmp.role.toLowerCase() &&
        (e.registration.trim().toUpperCase() === newEmp.registration.trim().toUpperCase() ||
          e.name.trim().toLowerCase() === newEmp.name.trim().toLowerCase())
    );

    if (isDuplicate) {
      console.warn('Colaborador já cadastrado neste turno e função:', newEmp);
      return;
    }

    const employee: Employee = {
      ...newEmp,
      id: String(Date.now()),
    };
    setEmployees((prev) => [employee, ...prev]);
  };

  const handleDeleteEmployee = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    const empName = emp ? emp.name : 'este colaborador';
    if (
      window.confirm(
        `Tem certeza que deseja excluir ${empName}? Esta ação removerá o colaborador do cadastro e das escalas.`
      )
    ) {
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleReorderCategoryEmployees = (reorderedCat: Employee[]) => {
    setEmployees((prev) => {
      const catIds = new Set(reorderedCat.map((e) => e.id));
      let idx = 0;
      return prev.map((e) => {
        if (catIds.has(e.id)) {
          return reorderedCat[idx++];
        }
        return e;
      });
    });
  };

  if (selectedShiftId) {
    const activeShift = SHIFT_CONFIGS.find((s) => s.id === selectedShiftId) || SHIFT_CONFIGS[0];

    return (
      <ShiftPage
        shift={activeShift}
        allShifts={SHIFT_CONFIGS}
        onSelectShift={(s) => setSelectedShiftId(s.id)}
        onBack={() => setSelectedShiftId(null)}
        employees={employees}
        onAddEmployee={handleAddEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onReorderEmployees={handleReorderCategoryEmployees}
      />
    );
  }

  return (
    <div className="relative min-h-screen text-slate-800 antialiased p-6 sm:p-12 flex flex-col justify-center">
      {/* Imagem de Fundo do Terminal */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/background.jpg')` }}
      />
      {/* Película de sobreposição para realce e contraste ideal */}
      <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto w-full">
        {/* Título */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            Escalas por Turno
          </h1>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SHIFT_CONFIGS.map((card) => (
            <div
              key={card.id}
              onClick={() => setSelectedShiftId(card.id)}
              className="group relative overflow-hidden bg-white/95 backdrop-blur-md rounded-3xl border border-white/60 p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer min-h-[260px]"
            >
              {/* Imagem de Fundo do Terminal de Contêineres com Opacidade Baixa */}
              {card.bgImage && (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-105 pointer-events-none opacity-20 group-hover:opacity-30"
                  style={{
                    backgroundImage: `url(${card.bgImage})`,
                  }}
                />
              )}

              {/* Película suave em degradê para garantir leitura 100% nítida */}
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/45 pointer-events-none" />

              {/* Conteúdo Principal do Card */}
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  {/* Emoji com container translúcido */}
                  <div className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 flex items-center justify-center text-3xl mb-5 shadow-xs group-hover:scale-110 group-hover:shadow-md transition-all">
                    <span>{card.emoji}</span>
                  </div>

                  {/* Título */}
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h2>

                  {/* Horário da Jornada */}
                  <div className="mt-3.5 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl px-3.5 py-2 shadow-2xs">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Jornada: <strong className="text-slate-900">{card.timeRange}</strong>
                    </span>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Acessar Setor</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-blue-600 group-hover:translate-x-1.5 transition-transform bg-blue-50/90 group-hover:bg-blue-600 group-hover:text-white px-3.5 py-1.5 rounded-xl border border-blue-200/80 group-hover:border-blue-600 shadow-2xs transition-colors">
                    <span>Abrir Escala</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
