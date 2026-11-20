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

// Colaboradores fiéis ao relatório operacional de teste (114 colaboradores no Turno Manhã)
const INITIAL_EMPLOYEES: Employee[] = [
  // 1. 35 Motoristas (OPERADOR TRACTOR) no Turno Manhã
  { id: '1001', name: 'Carlos Eduardo Silva', registration: '1001', role: 'Motorista', shiftId: 'manha' },
  { id: '1002', name: 'Jorge Ribeiro Santos', registration: '1002', role: 'Motorista', shiftId: 'manha' },
  { id: '1003', name: 'Fábio Alencar', registration: '1003', role: 'Motorista', shiftId: 'manha' },
  { id: '1004', name: 'Paulo Henrique Lima', registration: '1004', role: 'Motorista', shiftId: 'manha' },
  { id: '1005', name: 'Lucas Gabriel Costa', registration: '1005', role: 'Motorista', shiftId: 'manha' },
  { id: '1006', name: 'Rodrigo Medeiros', registration: '1006', role: 'Motorista', shiftId: 'manha' },
  { id: '1007', name: 'Fernando Dias', registration: '1007', role: 'Motorista', shiftId: 'manha' },
  { id: '1008', name: 'Marcos Vinícius Prado', registration: '1008', role: 'Motorista', shiftId: 'manha' },
  { id: '1009', name: 'Thiago Vieira', registration: '1009', role: 'Motorista', shiftId: 'manha' },
  { id: '1010', name: 'Alan Kardec Gomes', registration: '1010', role: 'Motorista', shiftId: 'manha' },
  { id: '1011', name: 'Bruno Cesar Fagundes', registration: '1011', role: 'Motorista', shiftId: 'manha' },
  { id: '1012', name: 'Caio Vinicius Moreira', registration: '1012', role: 'Motorista', shiftId: 'manha' },
  { id: '1013', name: 'Daniel Nogueira Lima', registration: '1013', role: 'Motorista', shiftId: 'manha' },
  { id: '1014', name: 'Eduardo Paes Barreto', registration: '1014', role: 'Motorista', shiftId: 'manha' },
  { id: '1015', name: 'Fabricio Ramos Silveira', registration: '1015', role: 'Motorista', shiftId: 'manha' },
  { id: '1016', name: 'Gabriel Menezes Castro', registration: '1016', role: 'Motorista', shiftId: 'manha' },
  { id: '1017', name: 'Hugo Leonardo Pires', registration: '1017', role: 'Motorista', shiftId: 'manha' },
  { id: '1018', name: 'Igor Santos Guimarães', registration: '1018', role: 'Motorista', shiftId: 'manha' },
  { id: '1019', name: 'Jonathan Farias Alves', registration: '1019', role: 'Motorista', shiftId: 'manha' },
  { id: '1020', name: 'Kleber Toledo Sobrinho', registration: '1020', role: 'Motorista', shiftId: 'manha' },
  { id: '1021', name: 'Leonardo Vasconcelos', registration: '1021', role: 'Motorista', shiftId: 'manha' },
  { id: '1022', name: 'Marcelo Duarte Freitas', registration: '1022', role: 'Motorista', shiftId: 'manha' },
  { id: '1023', name: 'Nilson Correa Pinheiro', registration: '1023', role: 'Motorista', shiftId: 'manha' },
  { id: '1024', name: 'Otavio Augusto Miranda', registration: '1024', role: 'Motorista', shiftId: 'manha' },
  { id: '1025', name: 'Paulo Roberto Peixoto', registration: '1025', role: 'Motorista', shiftId: 'manha' },
  { id: '1026', name: 'Rafael Antunes Borges', registration: '1026', role: 'Motorista', shiftId: 'manha' },
  { id: '1027', name: 'Sergio Magalhães Neto', registration: '1027', role: 'Motorista', shiftId: 'manha' },
  { id: '1028', name: 'Tiago Beltrão Fonseca', registration: '1028', role: 'Motorista', shiftId: 'manha' },
  { id: '1029', name: 'Uelton Martins Siqueira', registration: '1029', role: 'Motorista', shiftId: 'manha' },
  { id: '1030', name: 'Valdir Fernandes Jr', registration: '1030', role: 'Motorista', shiftId: 'manha' },
  { id: '1031', name: 'Wagner Lopes Queiroz', registration: '1031', role: 'Motorista', shiftId: 'manha' },
  { id: '1032', name: 'Xavier Couto Pacheco', registration: '1032', role: 'Motorista', shiftId: 'manha' },
  { id: '1033', name: 'Yuri Tavares Carvalho', registration: '1033', role: 'Motorista', shiftId: 'manha' },
  { id: '1034', name: 'Zaqueu Mendonça Reis', registration: '1034', role: 'Motorista', shiftId: 'manha' },
  { id: '1035', name: 'André Felipe Rocha', registration: '1035', role: 'Motorista', shiftId: 'manha' },

  // 2. 17 Operadores de RTG (OPERADOR DE RTG) no Turno Manhã
  { id: '3001', name: 'Alessandro Ramos', registration: '3001', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3002', name: 'Bernardo Furtado', registration: '3002', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3003', name: 'Claudio Duarte', registration: '3003', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3004', name: 'Douglas Alencar', registration: '3004', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3005', name: 'Emerson Pinheiro', registration: '3005', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3006', name: 'Felipe Marinho', registration: '3006', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3007', name: 'Gilson Barbosa', registration: '3007', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3008', name: 'Henrique Viana', registration: '3008', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3009', name: 'Italo Mendonça', registration: '3009', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3010', name: 'Jefferson Castro', registration: '3010', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3011', name: 'Kleber Antunes', registration: '3011', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3012', name: 'Luciano Silveira', registration: '3012', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3013', name: 'Marcelo Batista', registration: '3013', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3014', name: 'Nilton Nogueira', registration: '3014', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3015', name: 'Otavio Peixoto', registration: '3015', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3016', name: 'Paulo César Lima', registration: '3016', role: 'Operador de RTG', shiftId: 'manha' },
  { id: '3017', name: 'Rogério Toledo', registration: '3017', role: 'Operador de RTG', shiftId: 'manha' },

  // 3. 11 Operadores de Bloco (BLOCO C/ ENCARREGADO) no Turno Manhã
  { id: '4001', name: 'Andre de Oliveira', registration: '1361', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '4002', name: 'Leandro Jacob', registration: '1355', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '4003', name: 'Dalmo Cabral', registration: '1070', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '4004', name: 'Roberto Melo', registration: '1472', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '4005', name: 'Marcio Souza', registration: '1365', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '4006', name: 'Alexandre Anacleto', registration: '1190', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '4007', name: 'Alexandre Souza', registration: '1240', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '4008', name: 'Cristiano Martins', registration: '1312', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '4009', name: 'Claudio Jesus', registration: '1288', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '4010', name: 'Jony Cunha', registration: '1400', role: 'Operador de Bloco', shiftId: 'manha' },
  { id: '4011', name: 'Eduardo Guimarães', registration: '1450', role: 'Operador de Bloco', shiftId: 'manha' },

  // 4. 10 Assistentes de Pátio (ASSISTENTE DE PÁTIO) no Turno Manhã
  { id: '5001', name: 'Alan Delon Silva', registration: '5001', role: 'Assistente de Pátio', shiftId: 'manha' },
  { id: '5002', name: 'Bruno Meireles', registration: '5002', role: 'Assistente de Pátio', shiftId: 'manha' },
  { id: '5003', name: 'Caio Farias', registration: '5003', role: 'Assistente de Pátio', shiftId: 'manha' },
  { id: '5004', name: 'Diogo Albuquerque', registration: '5004', role: 'Assistente de Pátio', shiftId: 'manha' },
  { id: '5005', name: 'Everton Pires', registration: '5005', role: 'Assistente de Pátio', shiftId: 'manha' },
  { id: '5006', name: 'Fernando Prado', registration: '5006', role: 'Assistente de Pátio', shiftId: 'manha' },
  { id: '5007', name: 'Guilherme Santos', registration: '5007', role: 'Assistente de Pátio', shiftId: 'manha' },
  { id: '5008', name: 'Heitor Vasconcelos', registration: '5008', role: 'Assistente de Pátio', shiftId: 'manha' },
  { id: '5009', name: 'Igor Mendonça', registration: '5009', role: 'Assistente de Pátio', shiftId: 'manha' },
  { id: '5010', name: 'Julio Cesar Ramos', registration: '5010', role: 'Assistente de Pátio', shiftId: 'manha' },

  // 5. 10 Operadores Reach Stacker (OPERADOR DE RS) no Turno Manhã
  { id: '6001', name: 'Adalberto Gomes', registration: '6001', role: 'Operador Reach Stacker', shiftId: 'manha' },
  { id: '6002', name: 'Breno Ferreira', registration: '6002', role: 'Operador Reach Stacker', shiftId: 'manha' },
  { id: '6003', name: 'Cesar Augusto', registration: '6003', role: 'Operador Reach Stacker', shiftId: 'manha' },
  { id: '6004', name: 'Daniel Pacheco', registration: '6004', role: 'Operador Reach Stacker', shiftId: 'manha' },
  { id: '6005', name: 'Edilson Souza', registration: '6005', role: 'Operador Reach Stacker', shiftId: 'manha' },
  { id: '6006', name: 'Flavio Roberto', registration: '6006', role: 'Operador Reach Stacker', shiftId: 'manha' },
  { id: '6007', name: 'Gustavo Henrique', registration: '6007', role: 'Operador Reach Stacker', shiftId: 'manha' },
  { id: '6008', name: 'Helder Ribeiro', registration: '6008', role: 'Operador Reach Stacker', shiftId: 'manha' },
  { id: '6009', name: 'Ismael Pereira', registration: '6009', role: 'Operador Reach Stacker', shiftId: 'manha' },
  { id: '6010', name: 'Jorge Luiz Castro', registration: '6010', role: 'Operador Reach Stacker', shiftId: 'manha' },

  // 6. 9 Operadores de Portêiner (OPERADORES DE PT) no Turno Manhã
  { id: '7001', name: 'Alex Sandro Dias', registration: '7001', role: 'Operador de Portêiner', shiftId: 'manha' },
  { id: '7002', name: 'Benedito Carvalho', registration: '7002', role: 'Operador de Portêiner', shiftId: 'manha' },
  { id: '7003', name: 'Carlos Alberto Cruz', registration: '7003', role: 'Operador de Portêiner', shiftId: 'manha' },
  { id: '7004', name: 'Denis Fonseca', registration: '7004', role: 'Operador de Portêiner', shiftId: 'manha' },
  { id: '7005', name: 'Eduardo Magalhães', registration: '7005', role: 'Operador de Portêiner', shiftId: 'manha' },
  { id: '7006', name: 'Fabricio Costa', registration: '7006', role: 'Operador de Portêiner', shiftId: 'manha' },
  { id: '7007', name: 'Geraldo Vieira', registration: '7007', role: 'Operador de Portêiner', shiftId: 'manha' },
  { id: '7008', name: 'Hugo Macedo', registration: '7008', role: 'Operador de Portêiner', shiftId: 'manha' },
  { id: '7009', name: 'Ivanildo Santos', registration: '7009', role: 'Operador de Portêiner', shiftId: 'manha' },

  // 7. 7 Auxiliares de Pátio (AUXILIARES) no Turno Manhã
  { id: '8001', name: 'Antonio Marcos', registration: '8001', role: 'Auxiliar de Pátio', shiftId: 'manha' },
  { id: '8002', name: 'Bernardo Siqueira', registration: '8002', role: 'Auxiliar de Pátio', shiftId: 'manha' },
  { id: '8003', name: 'Celso Roberto', registration: '8003', role: 'Auxiliar de Pátio', shiftId: 'manha' },
  { id: '8004', name: 'Danilo Freitas', registration: '8004', role: 'Auxiliar de Pátio', shiftId: 'manha' },
  { id: '8005', name: 'Elias Peixoto', registration: '8005', role: 'Auxiliar de Pátio', shiftId: 'manha' },
  { id: '8006', name: 'Francisco Assis', registration: '8006', role: 'Auxiliar de Pátio', shiftId: 'manha' },
  { id: '8007', name: 'Gilberto Ramos', registration: '8007', role: 'Auxiliar de Pátio', shiftId: 'manha' },

  // 8. 6 Conferentes de Navio (CONFERENTES) no Turno Manhã
  { id: '9001', name: 'Arthur Vinicius', registration: '9001', role: 'Conferente de Navio', shiftId: 'manha' },
  { id: '9002', name: 'Bruno Henrique', registration: '9002', role: 'Conferente de Navio', shiftId: 'manha' },
  { id: '9003', name: 'Cristiano Ronaldo', registration: '9003', role: 'Conferente de Navio', shiftId: 'manha' },
  { id: '9004', name: 'Diego Armando', registration: '9004', role: 'Conferente de Navio', shiftId: 'manha' },
  { id: '9005', name: 'Eder Militao', registration: '9005', role: 'Conferente de Navio', shiftId: 'manha' },
  { id: '9006', name: 'Felipe Anderson', registration: '9006', role: 'Conferente de Navio', shiftId: 'manha' },

  // 9. 5 Estivadores (ESTIVADOR) no Turno Manhã
  { id: '9101', name: 'Alberto Silva', registration: '9101', role: 'Estivador', shiftId: 'manha' },
  { id: '9102', name: 'Bento Goncalves', registration: '9102', role: 'Estivador', shiftId: 'manha' },
  { id: '9103', name: 'Cleber Machado', registration: '9103', role: 'Estivador', shiftId: 'manha' },
  { id: '9104', name: 'David Luiz', registration: '9104', role: 'Estivador', shiftId: 'manha' },
  { id: '9105', name: 'Everson Felipe', registration: '9105', role: 'Estivador', shiftId: 'manha' },

  // 10. 4 Materiais (MATERIAL) no Turno Manhã
  { id: '9201', name: 'Alvaro Pereira', registration: '9201', role: 'Material', shiftId: 'manha' },
  { id: '9202', name: 'Bernardo Silva', registration: '9202', role: 'Material', shiftId: 'manha' },
  { id: '9203', name: 'Carlos Drummond', registration: '9203', role: 'Material', shiftId: 'manha' },
  { id: '9204', name: 'Djalma Santos', registration: '9204', role: 'Material', shiftId: 'manha' },

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

const STORAGE_KEY_EMPLOYEES = 'escala_terminal_employees_v5';

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
