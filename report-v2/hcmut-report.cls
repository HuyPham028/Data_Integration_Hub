\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{hcmut-report}

\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax
\LoadClass[12pt,a4paper]{article}

\RequirePackage{iftex}
\ifxetex
  \RequirePackage{fontspec}
\else
  \RequirePackage[utf8]{vntex,inputenc}
  \RequirePackage[T5]{fontenc}
\fi
\RequirePackage{anyfontsize,amsmath,amssymb}

\RequirePackage{geometry,graphicx,indentfirst,setspace}
\RequirePackage{booktabs}
\RequirePackage[center]{caption}

\RequirePackage{fancyhdr,hyperref}
\RequirePackage[super,square,sort]{natbib}

% Change to '[english,vietnamese]' to use Vietnamese labels
\RequirePackage[english, vietnamese]{babel}


% Custom commands
\newcommand{\Month}{
  \ifcase \the\month
  \or Tháng 1
  \or Tháng 2
  \or Tháng 3
  \or Tháng 4
  \or Tháng 5
  \or Tháng 6
  \or Tháng 7
  \or Tháng 8
  \or Tháng 9
  \or Tháng 10 
  \or Tháng 11 
  \or Tháng 12
  \fi
}

\newcommand{\@upperuniname}{Đại học Quốc gia TP.HCM}
\newcommand{\@uniname}{Trường Đại học Bách Khoa}

\newcommand{\@deptname}{Khoa Khoa học và Kỹ thuật Máy tính}
\newcommand{\deptname}[1]{\renewcommand{\@deptname}{#1}}

\newcommand{\@coursename}{Course name}
\newcommand{\coursename}[1]{\renewcommand{\@coursename}{#1}}

\newcommand{\@reporttype}{Assignment Report}
\newcommand{\reporttype}[1]{\renewcommand{\@reporttype}{#1}}

\renewcommand{\@title}{Report title}

\newcommand{\@advisor}{Advisor}
\newcommand{\advisor}[1]{\renewcommand{\@advisor}{#1}}

\newcommand{\@stuname}{STUDENT:\ H (xxxxxxx)}
\newcommand{\stuname}[1]{\renewcommand{\@stuname}{#1}}

\newcommand{\@reportplace}{Hồ Chí Minh}
\newcommand{\reportplace}[1]{\renewcommand{\@reportplace}{#1}}

\newcommand{\@reporttime}{\Month \the\year}
\newcommand{\reporttime}[1]{\renewcommand{\@reporttime}{#1}}

% Configurations
%\graphicspath{{subdir1/}{subdir2/}{subdir3/}...{subdirn/}}

\geometry{
  paper=a4paper,
  left=3cm,
  right=2cm,
  vmargin=2cm,
  includeheadfoot=true,
  headheight=35pt
}

\onehalfspacing
\raggedbottom
\renewcommand{\arraystretch}{1.2}

% Set depth of numbering for sections and table of contents
\setcounter{secnumdepth}{3}
\setcounter{tocdepth}{3}

% Set depth of numbering for counters
\AtBeginDocument{\counterwithin{equation}{section}}
\AtBeginDocument{\counterwithin{table}{section}}
\AtBeginDocument{\counterwithin{figure}{section}}

\AtBeginDocument{\renewcommand*\bibname{References}}

\hypersetup{
  colorlinks=true,
  linkcolor=black,
  citecolor=red,
  urlcolor=blue
}

\renewcommand{\headrulewidth}{0.3pt}
\renewcommand{\footrulewidth}{0pt}

\pagestyle{fancy}
\fancyhf{}

%\renewcommand{\subsectionmark}[1]{\markright{\thesubsection.\ #1}}

% The drawing units are interpreted as multiples of \unitlength
% unless a unit is given
%\setlength{\unitlength}{1pt}

\if@twoside
  \fancyhead[EL]{
    \bfseries
    \begin{tabular}{rl}
      \begin{picture}(25pt,15pt)
        \put(0,-8pt){\includegraphics[width=20pt]{graphics/hcmut.png}}
      \end{picture}
      \begin{tabular}{l}
        \ttfamily\@uniname \\
        \ttfamily\@deptname \\
      \end{tabular}
    \end{tabular}
  }
  \fancyhead[OR]{
    \bfseries
    \begin{tabular}{rl}
      \begin{tabular}{r}
        \ttfamily\@uniname \\
        \ttfamily\@deptname \\
      \end{tabular}
      \begin{picture}(25pt,15pt)
        \put(0,-8pt){\includegraphics[width=20pt]{graphics/hcmut.png}}
      \end{picture}
    \end{tabular}
  }
\else
  \fancyhead[R]{
    \bfseries
    \begin{tabular}{rl}
      \begin{tabular}{r}
        \ttfamily\@uniname \\
        \ttfamily\@deptname \\
      \end{tabular}
      \begin{picture}(25pt,15pt)
        \put(0,-8pt){\includegraphics[width=20pt]{graphics/hcmut.png}}
      \end{picture}
    \end{tabular}
  }
\fi

\fancyfoot[C]{\thepage}

% Custom pages and sections
\newcommand{\@major}{Khoa học Máy tính}
\newcommand{\major}[1]{\renewcommand{\@major}{#1}}

\newcommand{\@committee}{............}
\newcommand{\committee}[1]{\renewcommand{\@committee}{#1}}

\newcommand{\@reviewer}{.............}
\newcommand{\reviewer}[1]{\renewcommand{\@reviewer}{#1}}

\newcommand{\coverpage}{
  \pagestyle{empty}
  \singlespacing

  \begin{tikzpicture}[remember picture, overlay]
    \draw[line width=2pt]
      ($(current page.north west) + (3.0cm,-2.0cm)$)
      rectangle
      ($(current page.south east) + (-2.0cm,2.0cm)$);
    \draw[line width=0.5pt]
      ($(current page.north west) + (3.1cm,-2.1cm)$)
      rectangle
      ($(current page.south east) + (-2.1cm,2.1cm)$);
  \end{tikzpicture}

  \begin{center}
    {\fontsize{15}{18}\selectfont \textbf{\MakeUppercase{\@upperuniname}}} \\[0.1cm]
    {\fontsize{15}{18}\selectfont \textbf{\MakeUppercase{\@uniname}}} \\[0.1cm]
    {\fontsize{15}{18}\selectfont \textbf{\MakeUppercase{\@deptname}}} \\[0.6cm]

    \includegraphics[width=2.5cm]{graphics/hcmut.png} \\[0.6cm]

    {\fontsize{15}{18}\selectfont \textbf{BÁO CÁO}} \\[0.1cm]
    {\fontsize{15}{18}\selectfont \textbf{\MakeUppercase{\@coursename}}} \\[0.8cm]

    \parbox[c]{0.85\linewidth}{\centering \fontsize{17}{22}\selectfont \textbf{\@title}} \\

  \end{center}

  \vspace{0.6cm}

  \begin{flushright}
  \begin{minipage}{0.72\textwidth}
  {\fontsize{15}{18}\selectfont Ngành : \@major}
  \end{minipage}
  \end{flushright}

  \vspace{0.6cm}

  \begin{flushright}
    \begin{minipage}{0.72\textwidth}
      \fontsize{15}{20}\selectfont
      \textbf{HỘI ĐỒNG:} \textbf{\@committee} \\[0.2cm]
      \textbf{GVHD:} \textbf{\@advisor} \\[0.2cm]
      \textbf{GVPB:} \textbf{\@reviewer}
    \end{minipage}

    \begin{center}
      \fontsize{15}{20}\selectfont
      \textbf{---o0o---}
    \end{center}
    
    \begin{minipage}{0.72\textwidth}
      \fontsize{15}{20}\selectfont
      \textbf{SVTH 1: Trần Mạnh Tuấn} \textbf{(2213807)} \\[0.2cm]
      \textbf{SVTH 2: Phạm Lê Huy} \textbf{(2252260)}
    \end{minipage}
  \end{flushright}

  \vfill

  \begin{center}
    {\fontsize{15}{18}\selectfont \MakeUppercase{TP. \@reportplace, \@reporttime}}
  \end{center}

  \cleardoublepage
  \onehalfspacing
  \pagestyle{fancy}
}