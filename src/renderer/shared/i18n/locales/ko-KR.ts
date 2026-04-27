import enUS from './en-US';

export default {
  ...enUS,
  tabs: {
    ...enUS.tabs,
    homeTab: '홈',
    welcomeTitle: '환영합니다',
    welcomeDescription: '애플리케이션 홈 페이지입니다',
    openFolder: '폴더 열기',
    openProject: '프로젝트 열기',
    openFile: '파일 열기',
    recentFiles: '최근 파일',
    emptyRecentFiles: '최근 파일이 없습니다',
    noTabsHint: '왼쪽의 홈 버튼을 클릭하세요',
    tabActions: {
      ...enUS.tabs.tabActions,
      save: '저장',
      closeOthers: '다른 탭 닫기',
      closeAll: '모두 닫기',
      unsavedFile: '이 파일은 저장되지 않았습니다',
      confirmClose: '닫기 확인'
    },
    bottomPanel: {
      ...enUS.tabs.bottomPanel,
      placeholder: '탭 내용 영역',
      fileTab: '파일{index}'
    },
    ldfEditor: {
      ...enUS.tabs.ldfEditor,
      newSlaveNode: '새 슬레이브 노드',
      newFrame: '새 프레임',
      newScheduleTable: '새 스케줄 테이블',
      check: '검사',
      toggleHexDec: '16진수/10진수 전환',
      nodeView: '노드 뷰',
      frameView: '프레임 뷰',
      scheduleView: '스케줄 뷰',
      propertyView: '속성',
      checkFailed: '검사 실패: 필요한 블록이 없습니다',
      checkPassed: '검사 통과',
      frameEditor: {
        ...enUS.tabs.ldfEditor.frameEditor,
        title: '프레임 편집기',
        frameProperties: '프레임 속성',
        relations: '발행자 / 구독자 관계',
        subscriber: '구독자',
        signalMapping: '신호 매핑',
        viewModes: {
          ...enUS.tabs.ldfEditor.frameEditor.viewModes,
          list: '목록',
          matrix: '비트맵'
        },
        matrixDrag: {
          ...enUS.tabs.ldfEditor.frameEditor.matrixDrag,
          startBit: '시작',
          endBit: '끝'
        },
        name: '프레임 이름',
        id: '프레임 ID',
        publisher: '발행자',
        relationRoles: {
          ...enUS.tabs.ldfEditor.frameEditor.relationRoles,
          lockedWarning: '발행자/구독자를 편집하려면 최소 1개의 매핑된 신호 사용자 노드가 필요합니다.'
        },
        length: '길이',
        apply: '텍스트에 적용',
        updated: '프레임이 업데이트되었습니다',
        inserted: '프레임이 삽입되었습니다',
        columns: {
          ...enUS.tabs.ldfEditor.frameEditor.columns,
          signal: '신호',
          startBit: '시작 비트',
          updateBit: '초기값',
          length: '길이',
          unit: '단위',
          encoding: '인코딩',
          publisher: '발행자',
          subscribers: '구독자'
        },
        actions: {
          ...enUS.tabs.ldfEditor.frameEditor.actions,
          editSignal: '신호 편집',
          removeSignal: '신호 삭제',
          createAndMapSignal: '신호 생성 및 매핑',
          mapExistingSignal: '기존 신호 매핑'
        },
        contextMenu: {
          ...enUS.tabs.ldfEditor.frameEditor.contextMenu,
          open: '열기',
          revealInList: '목록에서 표시',
          revealInBitmap: '비트맵에서 표시'
        },
        hints: {
          ...enUS.tabs.ldfEditor.frameEditor.hints,
          editSignalTodo: '신호 편집 기능은 아직 구현되지 않았습니다',
          mapExistingSignalTodo: '기존 신호 매핑 기능은 아직 구현되지 않았습니다'
        },
        signalEditor: {
          ...enUS.tabs.ldfEditor.frameEditor.signalEditor,
          signalProperties: '신호 속성',
          encodingType: '인코딩 유형',
          name: '이름',
          initialValue: '초기값',
          signalType: '신호 유형',
          length: '길이',
          profilePlaceholder: '인코딩 이름을 입력하세요',
          noneOption: '<없음>',
          minimumRaw: '최소값 [raw]',
          maximumRaw: '최대값 [raw]',
          unit: '단위',
          factor: '계수',
          offset: '오프셋',
          newValueDescriptionPlaceholder: '새 값 설명',
          createAndMapSignal: '신호 생성 및 매핑',
          startBit: '시작 bit',
          endBit: '끝 bit',
          enterNamePlaceholder: '이름 입력',
          publisherSubscriberRelations: '발행자 / 구독자 관계',
          subscribers: '구독자',
          noAvailableNodes: '선택 가능한 노드가 없습니다',
          dragHereToSubscribe: '여기로 드래그해 구독',
          actions: {
            ...enUS.tabs.ldfEditor.frameEditor.signalEditor.actions,
            rename: '이름 바꾸기',
            create: '생성',
            delete: '삭제'
          },
          hints: {
            ...enUS.tabs.ldfEditor.frameEditor.signalEditor.hints,
            uncheckToSwitchEncoding: '안내: 체크를 해제하면 다른 인코딩 유형을 선택할 수 있습니다.',
            createOrSelectEncodingFirst: '먼저 위에서 인코딩을 생성하거나 선택하세요. 선택하지 않으면 이 영역은 편집할 수 없습니다.'
          },
          messages: {
            ...enUS.tabs.ldfEditor.frameEditor.signalEditor.messages,
            encodingDeleted: '인코딩이 삭제되었습니다',
            noEncodingToDelete: '삭제할 인코딩이 없습니다',
            relationRoleLockedWarningFallback: '발행자/구독자를 편집하려면 최소 1개의 매핑된 신호 사용자 노드가 필요합니다.',
            ldfValidateFailed: 'LDF 검증에 실패했습니다',
            signalOutOfFrameLength: '신호 범위가 현재 프레임 길이를 초과했습니다',
            signalRangeOverlap: '신호 범위가 다른 신호와 겹칩니다',
            ldfParseFailedApplyFrame: 'LDF 파싱 실패로 프레임 편집을 적용할 수 없습니다',
            ldfParseFailedApplySchedule: 'LDF 파싱 실패로 스케줄 편집을 적용할 수 없습니다',
            scheduleEntryFormat: '스케줄 항목 형식: FrameName delay 10 ms;',
            frameCreatedUiOnly: '프레임이 생성되었습니다(UI만, 텍스트에는 미반영)'
          },
          contextMenu: {
            ...enUS.tabs.ldfEditor.frameEditor.signalEditor.contextMenu,
            newValueDescription: '새 Value Description',
            deleteValueDescription: 'Value Description 삭제',
            newMultiRangeParam: '새 Multi-Range 파라미터',
            deleteMultiRangeParam: 'Multi-Range 파라미터 삭제'
          }
        }
      },
      scheduleEditor: {
        ...enUS.tabs.ldfEditor.scheduleEditor,
        title: '스케줄 편집기',
        name: '스케줄 이름',
        entry: '스케줄 항목',
        apply: '텍스트에 적용',
        updated: '스케줄이 업데이트되었습니다',
        inserted: '스케줄이 삽입되었습니다'
      },
      propertyEditor: {
        ...enUS.tabs.ldfEditor.propertyEditor,
        title: '속성',
        common: '일반',
        name: '이름',
        baudrate: '보레이트',
        comment: '설명',
        apply: '텍스트에 적용',
        updated: '속성이 업데이트되었습니다'
      },
      tree: {
        ...enUS.tabs.ldfEditor.tree,
        linBusDefault: 'LIN 버스',
        nodes: '노드',
        masterNode: '마스터',
        slaveNode: '슬레이브 노드',
        frames: '프레임',
        unconditionalFrames: '무조건 프레임',
        diagnosticFrames: '진단 프레임',
        eventTriggeredFrames: '이벤트 트리거 프레임',
        scheduleTables: '스케줄 테이블',
        pulishedSignaals: '발행 신호',
        subscribedSignals: '구독 신호',
        pulishedFrames: '발행 프레임',
        subscribedFrames: '구독 프레임'
      }
    }
  },
  layout: {
    ...enUS.layout,
    explorer: {
      ...enUS.layout.explorer,
      title: '탐색기',
      noFolder: '열린 폴더가 없습니다',
      hint: '여기를 더블클릭하거나 드래그해서 폴더 열기',
      hintImport: '여기를 더블클릭하거나 파일/폴더를 드래그해서 가져오기',
      openEditors: '열린 편집기',
      openFolders: '열린 폴더',
      openContainingFolder: '포함 폴더 열기',
      createFolder: '폴더 만들기',
      rename: '이름 바꾸기',
      closeFolder: '폴더 닫기',
      createFolderPrompt: '새 폴더 이름을 입력하세요',
      folderNameRequired: '폴더 이름은 필수입니다',
      folderNameInvalid: '폴더 이름에 잘못된 문자가 포함되어 있습니다',
      createFolderDuplicateName: '이 위치에 같은 이름의 파일 또는 폴더가 이미 있습니다. 다른 이름을 입력하세요.',
      renameDuplicateName: '이 위치에 같은 이름의 파일 또는 폴더가 이미 있습니다. 다른 이름을 입력하세요.',
      createFolderSuccess: '폴더가 생성되었습니다',
      createFolderFailed: '폴더 생성에 실패했습니다',
      renameSuccess: '이름이 변경되었습니다',
      renameFailed: '이름 변경에 실패했습니다',
      delete: '삭제',
      deleteConfirm: '"{name}"을(를) 삭제하시겠습니까?',
      deleteConfirmInline: '삭제 작업 확인',
      deleteSuccess: '삭제되었습니다',
      deleteFailed: '삭제에 실패했습니다',
      loadFolderFailed: '폴더 새로고침에 실패했습니다',
      importSuccess: '가져오기에 성공했습니다',
      importFailed: '가져오기에 실패했습니다',
      importNeedOpenFolder: '먼저 폴더를 열어주세요'
    },
    header: {
      ...enUS.layout.header,
      file: '파일',
      edit: '편집',
      tools: '도구',
      window: '창',
      help: '도움말',
      openFile: '파일 열기',
      openFolder: '폴더 열기',
      newProject: '새 프로젝트',
      newLdfFile: '새 LDF 파일',
      linLdfEditor: 'LIN LDF 편집기',
      settings: '설정',
      preferences: '환경설정',
      theme: '테마',
      language: '언어',
      save: '저장',
      about: '정보',
      localeNames: {
        zhCN: '중국어 간체',
        zhTW: '중국어 번체',
        enUS: 'English',
        jaJP: '日本語',
        koKR: '한국어'
      }
    },
    sidebar: {
      ...enUS.layout.sidebar,
      home: '홈',
      file: '파일',
      properties: '속성'
    }
  },
  properties: {
    ...enUS.properties,
    currentSelection: '현재 선택',
    selectHint: '먼저 탐색기에서 파일 또는 폴더를 선택하세요',
    name: '이름',
    type: '유형',
    path: '경로',
    size: '크기',
    modifiedAt: '수정 시간',
    unnamed: '이름 없음',
    file: '파일',
    directory: '폴더',
    unselected: '선택 안 됨',
    notApplicable: '-',
    pathCopied: '경로가 복사되었습니다',
    pathCopyFailed: '경로 복사에 실패했습니다',
    zeroKb: '0 KB',
    unmodified: '변경 없음',
    context: {
      ...enUS.properties.context,
      common: '일반',
      linbusProperties: 'LIN 버스 속성',
      folderProperties: '폴더 속성',
      fileProperties: '파일 속성',
      linProtocol: 'LIN 프로토콜',
      linProtocolVersion: 'LIN 프로토콜 버전',
      linLanguageVersion: 'LIN 언어 버전',
      generalCommanderProperties: '커맨더 일반 속성',
      commanderProperties: '커맨더 속성',
      name: '이름',
      baudrate: '보레이트',
      comment: '설명',
      nodeProperties: '노드 속성',
      role: '역할',
      master: '마스터',
      slave: '슬레이브',
      frameProperties: '프레임 속성',
      scheduleProperties: '스케줄 속성',
      entry: '항목'
    }
  },
  common: {
    ...enUS.common,
    confirm: '확인',
    cancel: '취소',
    close: '닫기',
    copy: '복사',
    newFile: '새로 만들기'
  }
};
