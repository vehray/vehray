import enUS from './en-US';

export default {
  ...enUS,
  tabs: {
    ...enUS.tabs,
    homeTab: 'ホーム',
    welcomeTitle: 'ようこそ',
    welcomeDescription: 'これはアプリケーションのホームページです',
    openFolder: 'フォルダーを開く',
    openProject: 'プロジェクトを開く',
    openFile: 'ファイルを開く',
    recentFiles: '最近開いたファイル',
    emptyRecentFiles: '最近のファイルはありません',
    noTabsHint: '左側のホームボタンをクリックしてください',
    tabActions: {
      ...enUS.tabs.tabActions,
      save: '保存',
      closeOthers: '他を閉じる',
      closeAll: 'すべて閉じる',
      unsavedFile: 'このファイルは未保存です',
      confirmClose: '閉じる'
    },
    bottomPanel: {
      ...enUS.tabs.bottomPanel,
      placeholder: 'タブ内容エリア',
      fileTab: 'ファイル{index}'
    },
    ldfEditor: {
      ...enUS.tabs.ldfEditor,
      newSlaveNode: '新規スレーブノード',
      newFrame: '新規フレーム',
      newScheduleTable: '新規スケジュールテーブル',
      check: 'チェック',
      toggleHexDec: '16進数/10進数を切り替え',
      nodeView: 'ノードビュー',
      frameView: 'フレームビュー',
      scheduleView: 'スケジュールビュー',
      propertyView: 'プロパティ',
      checkFailed: 'チェック失敗。必要なブロックが不足しています',
      checkPassed: 'チェック成功',
      frameEditor: {
        ...enUS.tabs.ldfEditor.frameEditor,
        title: 'フレームエディター',
        frameProperties: 'フレームプロパティ',
        relations: 'パブリッシャー / サブスクライバー関係',
        subscriber: 'サブスクライバー',
        signalMapping: 'シグナルマッピング',
        viewModes: {
          ...enUS.tabs.ldfEditor.frameEditor.viewModes,
          list: 'リスト',
          matrix: 'ビットマップ'
        },
        matrixDrag: {
          ...enUS.tabs.ldfEditor.frameEditor.matrixDrag,
          startBit: '開始',
          endBit: '終了'
        },
        name: 'フレーム名',
        id: 'フレーム ID',
        publisher: 'パブリッシャー',
        relationRoles: {
          ...enUS.tabs.ldfEditor.frameEditor.relationRoles,
          lockedWarning: 'パブリッシャー/サブスクライバーを編集するには、少なくとも1つのマップ済みシグナルユーザーノードが必要です。'
        },
        length: '長さ',
        apply: 'テキストへ適用',
        updated: 'フレームを更新しました',
        inserted: 'フレームを挿入しました',
        columns: {
          ...enUS.tabs.ldfEditor.frameEditor.columns,
          signal: 'シグナル',
          startBit: '開始ビット',
          updateBit: '初期値',
          length: '長さ',
          unit: '単位',
          encoding: 'エンコーディング',
          publisher: 'パブリッシャー',
          subscribers: 'サブスクライバー'
        },
        actions: {
          ...enUS.tabs.ldfEditor.frameEditor.actions,
          editSignal: 'シグナル編集',
          removeSignal: 'シグナル削除',
          createAndMapSignal: 'シグナルを作成してマッピング',
          mapExistingSignal: '既存シグナルをマッピング'
        },
        contextMenu: {
          ...enUS.tabs.ldfEditor.frameEditor.contextMenu,
          open: '開く',
          revealInList: 'リストで表示',
          revealInBitmap: 'ビットマップで表示'
        },
        hints: {
          ...enUS.tabs.ldfEditor.frameEditor.hints,
          editSignalTodo: 'シグナル編集機能は未実装です',
          mapExistingSignalTodo: '既存シグナルのマッピング機能は未実装です'
        },
        signalEditor: {
          ...enUS.tabs.ldfEditor.frameEditor.signalEditor,
          signalProperties: 'シグナルプロパティ',
          encodingType: 'エンコーディングタイプ',
          name: '名前',
          initialValue: '初期値',
          signalType: 'シグナルタイプ',
          length: '長さ',
          profilePlaceholder: 'エンコーディング名を入力してください',
          noneOption: '<なし>',
          minimumRaw: '最小値 [raw]',
          maximumRaw: '最大値 [raw]',
          unit: '単位',
          factor: '係数',
          offset: 'オフセット',
          newValueDescriptionPlaceholder: '新しい値説明',
          createAndMapSignal: 'シグナルを作成してマッピング',
          startBit: '開始 bit',
          endBit: '終了 bit',
          enterNamePlaceholder: '名前を入力',
          publisherSubscriberRelations: 'パブリッシャー / サブスクライバー関係',
          subscribers: 'サブスクライバー',
          noAvailableNodes: '選択可能なノードがありません',
          dragHereToSubscribe: 'ここへドラッグして購読',
          actions: {
            ...enUS.tabs.ldfEditor.frameEditor.signalEditor.actions,
            rename: '名前変更',
            create: '作成',
            delete: '削除'
          },
          hints: {
            ...enUS.tabs.ldfEditor.frameEditor.signalEditor.hints,
            uncheckToSwitchEncoding: 'ヒント: チェックを外すと別のエンコーディングタイプを選択できます。',
            createOrSelectEncodingFirst: '先に上でエンコーディングを作成または選択してください。未選択時はこの領域は編集不可です。'
          },
          messages: {
            ...enUS.tabs.ldfEditor.frameEditor.signalEditor.messages,
            encodingDeleted: 'エンコーディングを削除しました',
            noEncodingToDelete: '削除できるエンコーディングがありません',
            relationRoleLockedWarningFallback: 'パブリッシャー/サブスクライバーを編集するには、少なくとも1つのマップ済みシグナルユーザーノードが必要です。',
            ldfValidateFailed: 'LDF 検証に失敗しました',
            signalOutOfFrameLength: 'シグナル範囲が現在のフレーム長を超えています',
            signalRangeOverlap: 'シグナル範囲が他のシグナルと重複しています',
            ldfParseFailedApplyFrame: 'LDF 解析に失敗し、フレーム編集を適用できません',
            ldfParseFailedApplySchedule: 'LDF 解析に失敗し、スケジュール編集を適用できません',
            scheduleEntryFormat: 'スケジュール項目の形式: FrameName delay 10 ms;',
            frameCreatedUiOnly: 'フレームを作成しました（UI のみ、テキスト未反映）'
          },
          contextMenu: {
            ...enUS.tabs.ldfEditor.frameEditor.signalEditor.contextMenu,
            newValueDescription: '新規 Value Description',
            deleteValueDescription: 'Value Description を削除',
            newMultiRangeParam: '新規 Multi-Range パラメータ',
            deleteMultiRangeParam: 'Multi-Range パラメータを削除'
          }
        }
      },
      scheduleEditor: {
        ...enUS.tabs.ldfEditor.scheduleEditor,
        title: 'スケジュールエディター',
        name: 'スケジュール名',
        entry: 'スケジュール項目',
        apply: 'テキストへ適用',
        updated: 'スケジュールを更新しました',
        inserted: 'スケジュールを挿入しました'
      },
      propertyEditor: {
        ...enUS.tabs.ldfEditor.propertyEditor,
        title: 'プロパティ',
        common: '共通',
        name: '名前',
        baudrate: 'ボーレート',
        comment: 'コメント',
        apply: 'テキストへ適用',
        updated: 'プロパティを更新しました'
      },
      tree: {
        ...enUS.tabs.ldfEditor.tree,
        linBusDefault: 'LIN バス',
        nodes: 'ノード',
        masterNode: 'マスター',
        slaveNode: 'スレーブノード',
        frames: 'フレーム',
        unconditionalFrames: '通常フレーム',
        diagnosticFrames: '診断フレーム',
        eventTriggeredFrames: 'イベントトリガーフレーム',
        scheduleTables: 'スケジュールテーブル',
        pulishedSignaals: '送信シグナル',
        subscribedSignals: '受信シグナル',
        pulishedFrames: '送信フレーム'
      }
    }
  },
  layout: {
    ...enUS.layout,
    explorer: {
      ...enUS.layout.explorer,
      title: 'エクスプローラー',
      noFolder: 'フォルダーが開かれていません',
      hint: 'ここをダブルクリックまたはドラッグしてフォルダーを開く',
      hintImport: 'ここをダブルクリックまたはファイル/フォルダーをドラッグしてインポート',
      openEditors: '開いているエディター',
      openFolders: '開いているフォルダー',
      openContainingFolder: '含まれるフォルダーを開く',
      createFolder: 'フォルダーを作成',
      rename: '名前を変更',
      closeFolder: 'フォルダーを閉じる',
      createFolderPrompt: '新しいフォルダー名を入力',
      folderNameRequired: 'フォルダー名は必須です',
      folderNameInvalid: 'フォルダー名に無効な文字が含まれています',
      createFolderDuplicateName: 'この場所には同名のファイルまたはフォルダーがあります。別の名前を入力してください。',
      renameDuplicateName: 'この場所には同名のファイルまたはフォルダーがあります。別の名前を入力してください。',
      createFolderSuccess: 'フォルダーを作成しました',
      createFolderFailed: 'フォルダーの作成に失敗しました',
      renameSuccess: '名前を変更しました',
      renameFailed: '名前の変更に失敗しました',
      delete: '削除',
      deleteConfirm: '"{name}" を削除しますか？',
      deleteConfirmInline: '削除を確認',
      deleteSuccess: '削除しました',
      deleteFailed: '削除に失敗しました',
      loadFolderFailed: 'フォルダーの更新に失敗しました',
      importSuccess: 'インポートしました',
      importFailed: 'インポートに失敗しました',
      importNeedOpenFolder: '先にフォルダーを開いてください'
    },
    header: {
      ...enUS.layout.header,
      file: 'ファイル',
      edit: '編集',
      tools: 'ツール',
      window: 'ウィンドウ',
      help: 'ヘルプ',
      openFile: 'ファイルを開く',
      openFolder: 'フォルダーを開く',
      newProject: '新規プロジェクト',
      newLdfFile: '新規 LDF ファイル',
      linLdfEditor: 'LIN LDF エディター',
      settings: '設定',
      preferences: '環境設定',
      theme: 'テーマ',
      language: '言語',
      save: '保存',
      about: '情報',
      localeNames: {
        zhCN: '簡体字中国語',
        zhTW: '繁体字中国語',
        enUS: 'English',
        jaJP: '日本語',
        koKR: '한국어'
      }
    },
    sidebar: {
      ...enUS.layout.sidebar,
      home: 'ホーム',
      file: 'ファイル',
      properties: 'プロパティ'
    }
  },
  properties: {
    ...enUS.properties,
    currentSelection: '現在の選択',
    selectHint: '先にエクスプローラーでファイルまたはフォルダーを選択してください',
    name: '名前',
    type: '種類',
    path: 'パス',
    size: 'サイズ',
    modifiedAt: '更新日時',
    unnamed: '無題',
    file: 'ファイル',
    directory: 'フォルダー',
    unselected: '未選択',
    notApplicable: '-',
    pathCopied: 'パスをコピーしました',
    pathCopyFailed: 'パスのコピーに失敗しました',
    zeroKb: '0 KB',
    unmodified: '未変更',
    context: {
      ...enUS.properties.context,
      common: '一般',
      linbusProperties: 'LIN バスプロパティ',
      folderProperties: 'フォルダープロパティ',
      fileProperties: 'ファイルプロパティ',
      linProtocol: 'LIN プロトコル',
      linProtocolVersion: 'LIN プロトコルバージョン',
      linLanguageVersion: 'LIN 言語バージョン',
      generalCommanderProperties: 'コマンダー一般プロパティ',
      commanderProperties: 'コマンダープロパティ',
      name: '名前',
      baudrate: 'ボーレート',
      comment: 'コメント',
      nodeProperties: 'ノードプロパティ',
      role: 'ロール',
      master: 'マスター',
      slave: 'スレーブ',
      frameProperties: 'フレームプロパティ',
      scheduleProperties: 'スケジュールプロパティ',
      entry: 'エントリ'
    }
  },
  common: {
    ...enUS.common,
    confirm: '確認',
    cancel: 'キャンセル',
    close: '閉じる',
    copy: 'コピー',
    newFile: '新規作成'
  }
};
